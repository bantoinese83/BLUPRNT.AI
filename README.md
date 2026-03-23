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
*   **PWA Support**: Full "Add to Home Screen" experience with offline caching.
*   **Project Lifecycle**: Archive and manage multiple properties or renovation phases with ease.

## Quick start

1. **Environment**

   Copy `.env.example` to `.env` and set:

   - `VITE_SUPABASE_URL` — Project URL (Settings → API)
   - `VITE_SUPABASE_ANON_KEY` — anon public key

2. **Auth — Google & magic links**

   In **Supabase Dashboard → Authentication → URL Configuration**:

   - **Site URL**: `https://bluprntai.com`
   - **Redirect URLs**: add  
     `http://localhost:3000/auth/callback`  
     `https://bluprntai.com/auth/callback`

   **Google**: Authentication → **Providers** → **Google** → enable and paste **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/) (OAuth 2.0 Web client). Authorized redirect URI in Google must be:  
   `https://<YOUR_SUPABASE_REF>.supabase.co/auth/v1/callback`  
   (Supabase shows this in the Google provider settings.)

   **Magic links**: Email provider must be on. The app sends OTP sign-in (login) and signup (register) links to **`/auth/callback`**.

   Optional in `.env`: **`VITE_SITE_URL`** = production origin so redirects stay correct behind proxies.

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
3. **Set Secrets**: In Supabase, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
4. **Deploy**: `supabase functions deploy create-checkout stripe-webhook`.

## Edge Functions (backend)

| Function           | JWT   | Purpose |
|--------------------|-------|---------|
| `create-checkout`  | On    | Generate secure Stripe Checkout session |
| `stripe-webhook`   | Off   | Receive Stripe events (provisioning) |
| `photo-to-scope`   | Off*  | Build estimate from ZIP, room type, optional photos |
| `upload-invoice`   | On    | Upload PDF/image → Storage + `documents` + `invoices` |
| `get-invoice`      | On    | Load invoice + line items |
| `get-project-view` | Off   | Public: fetch project + scope by share token |

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
| `STRIPE_SECRET_KEY` | Stripe secret key for webhook (stripe-webhook function) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard |
| `GEMINI_API_KEY` | Google AI API key for invoice OCR (optional; when set, extracts vendor, line items, totals from PDFs) |

## Database

Core tables: `properties`, `projects`, `scope_items`, `documents`, `invoices`, `invoice_line_items`, `project_view_tokens`, `seller_packets`, plus Storage bucket `project-documents`.

Apply migrations from the Supabase SQL editor or CLI to match your project schema. Run migrations in order:
1. `20250318000000_project_view_tokens.sql`
2. `20250318100000_full_schema.sql`
3. `20250318110000_invoices_document_type.sql` (adds `document_type`)
4. `20250318120000_subscriptions_and_passes.sql` (user_subscriptions, project_passes, Stripe webhook support)

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
