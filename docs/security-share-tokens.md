# Public project share tokens — security model

This document describes how BLUPRNT share links work, what data they expose, and the controls in place. Use it for reviews, onboarding, and incident response.

## Overview

Homeowners can generate a **time-limited, unguessable URL** so contractors or family can view a **read-only summary** of a project (name, estimate range, scope line items). Tokens are stored in `project_view_tokens` and resolved only through the **`get-project-view`** Edge Function (service role). Clients never query tokens directly with the anon key.

```
Owner (authenticated) → INSERT project_view_tokens (RLS)
Visitor (no auth)     → GET /functions/v1/get-project-view?token=…
```

## Token properties

| Property          | Implementation                                                                               |
| :---------------- | :------------------------------------------------------------------------------------------- |
| **Entropy**       | UUID v4 (`crypto.randomUUID()` on web; `expo-crypto` on mobile)                              |
| **TTL**           | 30 days (`expires_at` set at insert)                                                         |
| **Transport**     | HTTPS only; token in URL path `/project/:token` (web)                                        |
| **Revocation**    | Owners can delete rows via RLS; no server-side “revoke all” UI yet                           |
| **Scope of data** | Project summary fields + scope items only — no documents, ledger, or PII beyond project name |

## Database (RLS)

Policies on `project_view_tokens` (see `supabase/migrations/20260420100000_consolidated_schema.sql`):

- **INSERT** — project owner only (`projects.user_id = auth.uid()`)
- **SELECT** — owner only (listing own tokens)
- **DELETE** — owner only

There is **no** anon/authenticated `SELECT` on tokens by value. Lookup by token uses the Edge Function service client.

## Edge Function: `get-project-view`

- **Method:** GET only
- **Auth:** None; uses `Authorization: Bearer <anon>` for Supabase gateway only
- **Rate limit:** `public_share` kind — default **30 requests / minute / IP** (configurable via `RATE_LIMIT_PUBLIC_SHARE_*`). Backed by Upstash when `UPSTASH_REDIS_REST_*` is set.
- **Responses:** Uniform 404 for missing/invalid tokens; **410** when `expires_at` is in the past (no oracle for “valid but expired” vs “never existed” beyond message copy)
- **Cache:** `Cache-Control: public, max-age=10, stale-while-revalidate=50` on success

## Threat model (summary)

| Threat                         | Mitigation                                  | Residual risk                                  |
| :----------------------------- | :------------------------------------------ | :--------------------------------------------- |
| Token guessing                 | UUID v4 (~122 bits)                         | Negligible at scale                            |
| Token leakage (referrer, logs) | `noindex` on public view; short TTL         | Link forwarded intentionally or via screenshot |
| Enumeration / scraping         | Per-IP rate limit; no bulk list API         | Determined attacker with many IPs              |
| IDOR on other projects         | Lookup by token only; no `project_id` param | N/A if token secret                            |
| Over-sharing PII               | Response limited to estimate + scope        | Project name may identify homeowner            |
| Owner account compromise       | Attacker can mint new tokens                | Standard account security                      |

## Operational checklist

- [ ] Upstash Redis configured in production for distributed rate limits
- [ ] Monitor 429 rate on `get-project-view`
- [ ] Review scope fields returned in `get-project-view` when adding columns to `scope_items`
- [ ] Consider user-facing “revoke share links” and shorter default TTL for sensitive projects

## Related code

- `web/src/lib/share-project.ts`, `mobile/src/lib/share-project.ts` — token creation
- `web/src/pages/ProjectView.tsx` — public UI
- `supabase/functions/get-project-view/index.ts` — resolver
- `supabase/functions/_shared/rate-limit.ts` — `public_share` limiter
- `e2e/project-view-share.spec.ts` — smoke test

## Future improvements (Phase 3+)

- Optional one-time or max-view tokens
- Audit log when a share link is opened
- Stricter rate limit per token (not only per IP)
- Content Security Policy headers on `/project/*`
