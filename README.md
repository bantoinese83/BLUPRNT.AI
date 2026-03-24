# BLUPRNT.AI (v3) 🏆
**The Homeowner-First Financial OS for Renovations.**

Vite + React + **Supabase** (Postgres, Auth, Storage) + **Edge Functions** for detailed cost estimates, invoice OCR, and resale value analytics.

## Location (onboarding)

The location step **auto-fills** an approximate area from your network (IP → reverse geocode via [Photon](https://photon.komoot.io/)). **Use precise location** uses the browser GPS API for a tighter ZIP or place name. You can always edit the field.

## 🚀 Features (reaching 100/100 completeness)

*   **Regional AI Estimates**: Snap photos or enter a postal code to get locally grounded renovation budgets.
*   **Invoice OCR & Ledger**: Upload receipts to automatically map actual costs against your budget.
*   **Resale Value Impact**: Visualize the financial impact and ROI of your home improvements.
*   **Seller Packet**: Export a professional PDF of your renovation history to hand to agents and buyers.
*   **Web app**: Standard SPA deployment; service worker / web app manifest are disabled to avoid stale caches and install prompts.
*   **Project Lifecycle**: Archive and manage multiple properties or renovation phases with ease.

## Quick start

1. **Environment**

   Copy `.env.example` to `.env` and set:

   - `VITE_SUPABASE_URL` — Project URL (Settings → API)
   - `VITE_SUPABASE_ANON_KEY` — anon public key

2. **Auth — Google & magic links**

   In **Supabase Dashboard → Authentication → URL Configuration**:

   - **Site URL**: `https://bluprntai.com`
   - **Redirect URLs**: add (adjust host to your canonical domain)  
     `http://localhost:3000/**`  
     `https://bluprntai.com/**`  
     If you serve **`www`**, also add `https://www.bluprntai.com/**` **or** redirect `www` → apex in your host so only one hostname is used everywhere.

   **Google**: Authentication → **Providers** → **Google** → enable and paste **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/) (OAuth 2.0 Web client). Authorized redirect URI in Google must be:  
   `https://<YOUR_SUPABASE_REF>.supabase.co/auth/v1/callback`  
   (Supabase shows this in the Google provider settings.)  
   **Authorized JavaScript origins** must include the exact origin users load the app from (e.g. `https://bluprntai.com` and `https://www.bluprntai.com` if both exist).

   **Magic links**: Email provider must be on. The app sends OTP sign-in (login) and signup (register) links to **`/auth/callback`**.

   **`VITE_SITE_URL`**: In production `.env`, set this to your **canonical** origin (no trailing slash), matching **Site URL** and Google JS origins — avoids wrong callback URLs behind proxies or alternate hostnames.

3. **Auth (password / onboarding)**

   For email+password signup during onboarding, either turn **off** “Confirm email” under **Email**, or confirm email before the app can save your project in one step.

4. **Install & run**

   ```bash
   npm install
   npm run dev
   ```

## Stripe (paid plans)

BLUPRNT.AI uses dynamic Stripe Checkout via Supabase Edge Functions.

1. **Create Products** in Stripe (Architect Monthly & Project Pass).
2. **Add to `.env`**:
   ```env
   VITE_STRIPE_ARCHITECT_PRICE_ID=price_1...
   VITE_STRIPE_PROJECT_PASS_PRICE_ID=price_1...
   ```
3. **Set Secrets**: In Supabase, set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and **`STRIPE_ARCHITECT_PRICE_ID`** (must match the Architect price used in checkout so the function can choose subscription vs one-time mode).
4. **Deploy**: `supabase functions deploy create-checkout stripe-webhook`.

## Edge Functions (backend)

| Function           | JWT   | Purpose |
|--------------------|-------|---------|
| `create-checkout`  | On    | Generate secure Stripe Checkout session |
| `stripe-webhook`   | Off   | Receive Stripe events (provisioning) |
| `photo-to-scope`   | Off*  | Build estimate from ZIP, room type, optional photos (Gemini + optional Google Search grounding) |
| `upload-invoice`   | On    | Upload PDF/image → Storage + `documents` + `invoices` (Gemini vision OCR when `GEMINI_API_KEY` is set) |
| `get-invoice`      | On    | Load invoice + line items |
| `get-project-view` | Off   | Public: fetch project + scope by share token |
| `delete-account`   | On    | Delete user data, Storage files in `project-documents`, Stripe subscription/customer when `STRIPE_SECRET_KEY` is set, then remove auth user |

\*Gateway JWT off so guests can run the first estimate; saving to a project still requires a valid user token.

### Deploy

```bash
# Photo estimate (public invoke)
npx supabase login
npx supabase functions deploy photo-to-scope --project-ref YOUR_PROJECT_REF --no-verify-jwt

# Invoice APIs (require signed-in user)
npx supabase functions deploy upload-invoice get-invoice --project-ref YOUR_PROJECT_REF

# Share project view (public)
npx supabase functions deploy get-project-view --project-ref YOUR_PROJECT_REF --no-verify-jwt
```

Edge runtime already has `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

### Edge Function secrets (optional)

Set via Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Secret | Description |
|--------|-------------|
| `ALLOWED_ORIGINS` | Comma-separated origins for CORS. If unset, allows `*`. |
| `RATE_LIMIT_REQUESTS` | Max requests per window (default: 60) |
| `RATE_LIMIT_WINDOW_MS` | Window in ms (default: 60000) |
| `STRIPE_SECRET_KEY` | Stripe secret key: `stripe-webhook`, `create-checkout`, and `delete-account` (billing cleanup) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard |
| `STRIPE_ARCHITECT_PRICE_ID` | **Required** for `create-checkout`. Architect Price ID from Stripe; used to distinguish subscription (Architect) vs one-time (Project Pass) checkout mode. |
| `GEMINI_API_KEY` | Google Gemini API key for **invoice OCR** and **photo-to-scope** estimates (Edge only; never expose in Vite). |
| `GEMINI_MODEL` | Optional. Gemini model id (default `gemini-2.5-flash`). Override per [Gemini models](https://ai.google.dev/gemini-api/docs/models). |

#### Gemini API (Edge)

Renovation estimates and invoice parsing use the **Gemini REST** `generateContent` API. Maintainer reference: **[docs/gemini-api.md](docs/gemini-api.md)**.

**Google documentation:**

- [Models](https://ai.google.dev/gemini-api/docs/models) — model names, tiers, deprecations  
- [Text generation](https://ai.google.dev/gemini-api/docs/text-generation) — REST `contents` / `parts`  
- [Tools](https://ai.google.dev/gemini-api/docs/tools) — built-in tools vs function calling  
- [Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search) — `google_search` tool used for **local market–aware** estimates in `photo-to-scope`

Shared client: `supabase/functions/_shared/gemini.ts` (`callGemini`). Estimates pass **`google_search`** grounding; OCR uses structured JSON only (no search tool).

## Database

Core tables: `properties`, `projects`, `scope_items`, `documents`, `invoices`, `invoice_line_items`, `project_view_tokens`, `seller_packets`, plus Storage bucket `project-documents`.

Apply migrations from the Supabase SQL editor or CLI to match your project schema. Run migrations in order:
1. `20250318000000_project_view_tokens.sql`
2. `20250318100000_full_schema.sql`
3. `20250318110000_invoices_document_type.sql` (adds `document_type`)
4. `20250318120000_subscriptions_and_passes.sql` (user_subscriptions, project_passes, Stripe webhook support)
5. `20250324100000_lock_down_get_user_id_by_email.sql` (RPC callable only by `service_role`)

### Observability and scaling

- **Edge logs**: Functions emit JSON lines via `console` (`_shared/log.ts`). Search logs in Supabase (or your host) by `message` / `level`.
- **Client crashes**: The root `ErrorBoundary` logs a single JSON line with a random `eventId`; users can share that id with support.
- **Rate limits**: Default limiter is in-memory per isolate (see `_shared/rate-limit.ts`). For multi-instance fairness or stricter caps, add **Redis (e.g. Upstash)**, **gateway limits**, or a **shared DB counter**—see comments in that file.

### Schema overview

| Table | Purpose |
|-------|---------|
| `properties` | Address, postal_code, city, state, country, approximate_location; `owner_user_id` links to auth |
| `projects` | `property_id`, name, room_type, stage, finish_preference, estimated_min_total, estimated_max_total, confidence_score |
| `scope_items` | `project_id`, category, description, finish_tier, quantity, unit, unit_cost_min/max, total_cost_min/max |
| `documents` | `project_id`, type (invoice/quote/warranty/permit), storage path, original_filename |
| `invoices` | `project_id`, vendor_name, total, payment_status, OCR status |
| `invoice_line_items` | `invoice_id`, description, amount, quantity; optional `scope_item_id` for mapping to scope |
| `project_view_tokens` | `project_id`, token, expires_at — for share links |
| `seller_packets` | `project_id`, `property_id`, `storage_path`, `generated_at` |
| `user_subscriptions` | Architect plan: stripe_subscription_id, status, invoice_uploads_count |
| `project_passes` | One-time $49: project_id, expires_at (6 months) |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |
| `npm run lint` | ESLint + TypeScript check |
| `npm run functions:deploy:photo` | Deploy `photo-to-scope` |
| `npm run functions:deploy:invoices` | Deploy invoice functions |
| `npm run functions:deploy:project-view` | Deploy `get-project-view` |

---

**Troubleshooting:** If `functions.invoke` fails, confirm functions are deployed, CORS is fine for your origin, and the anon key matches the project.
