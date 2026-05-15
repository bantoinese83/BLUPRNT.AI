# Security

## Supported versions

We ship the **current `main` branch** of this monorepo (web, mobile, shared, and Supabase edge functions). Security fixes land on `main` first; use tagged releases or your deployment pipeline for production pinning.

## Reporting a vulnerability

**Please do not open a public GitHub issue** for undisclosed security problems.

1. Email **[connect@monarch-labs.com](mailto:connect@monarch-labs.com?subject=Security%20disclosure%20%E2%80%94%20BLUPRNT)** (use subject line `Security disclosure — BLUPRNT`) with:
   - A short description of the issue and its impact
   - Steps to reproduce (requests, payloads, or code paths)
   - Any suggested fix or mitigation (optional)

2. We aim to acknowledge within **5 business days** and coordinate disclosure and patch timing with you.

## Scope

In scope for reports:

- Authentication and session handling (web, mobile, Supabase Auth)
- Authorization bugs (RLS, client-side checks that bypass server rules)
- Injection, SSRF, or unsafe deserialization in **edge functions** or **server-adjacent** code
- Secrets or credentials committed to the repo or exposed in builds

Out of scope (use normal issues):

- Denial-of-service against shared infrastructure without a clear product bug
- Social engineering or physical access scenarios

## Public share links

Read-only project URLs (`/project/:token`) use UUID tokens, 30-day expiry, RLS on `project_view_tokens`, and the `get-project-view` edge function with per-IP rate limiting. See [docs/security-share-tokens.md](docs/security-share-tokens.md) for the threat model and operational checklist.

## Secure development

Contributors should run **`npm run check`** before merging; CI runs lint, typecheck, tests with coverage gates, production builds, Playwright e2e, Maestro (mobile), Lighthouse (web PRs), and Deno checks for edge functions. See [CONTRIBUTING.md](CONTRIBUTING.md).
