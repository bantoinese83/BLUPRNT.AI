# BLUPRNT.AI Production Launch Handbook

This document serves as the master record of the production hardening process completed prior to the launch of BLUPRNT.AI. It contains all critical configuration steps, API setups, and troubleshooting guides for the infrastructure powering the platform.

---

## 1. App Store Connect & RevenueCat (Monetization)

We successfully connected the mobile app to Apple's In-App Purchase system to handle subscriptions.

### What was done:

- **Bundle ID**: Registered `ai.bluprnt.mobile` in the Apple Developer Portal.
- **App Name Conflicts**: Successfully secured the name "BLUPRNT.AI" in App Store Connect.
- **RevenueCat Dashboard**: We uploaded the Apple `.p8` In-App Purchase Key to RevenueCat to allow it to communicate with Apple servers.
- **Smart Environment Switching**: The mobile app (`mobile/app/_layout.tsx`) is now environment-aware.
  - When running in **Expo Go**, it automatically uses the `test_` RevenueCat key so you don't encounter native API crashes.
  - When running in a **Real Native Build** (EAS Build/TestFlight), it automatically uses the production `appl_` key.

### Troubleshooting:

> [!WARNING]
> **Android Configuration Missing**: Before launching on the Google Play Store, you MUST repeat the RevenueCat App Configuration process for Android and insert the generated `goog_` key into the `mobile/.env` file.

> [!TIP]
> If purchases are failing in TestFlight, completely log out of your Apple ID in iOS Settings, log in with an Apple Sandbox Tester account, and try again.

---

## 2. Supabase Backend Sync & Hardening

We ensured the local database schema and edge functions exactly match the live production environment.

### What was done:

- **Edge Functions**: Deployed all 11 Edge Functions to `elucgaegaihkklnfoasm`.
- **Database Sync**: Pushed all custom RPCs (e.g., `recalc_project_totals`) and SQL migrations to production.
- **Secure Storage**: Created two new private storage buckets:
  1. `project-documents` (for PDF invoices/quotes)
  2. `project-photos` (for Gemini vision processing)
- **Storage RLS**: Enabled strict Row Level Security on the storage buckets so users can only read/write files located inside their own `project_id` folder.

### Troubleshooting:

> [!NOTE]
> If users cannot upload invoices, check the Supabase Storage logs. Ensure the user is authenticated and the RLS policy is correctly parsing their `auth.uid()`.

---

## 3. RevenueCat Database Sync (Webhooks)

We configured RevenueCat to tell the Supabase database whenever someone buys or cancels a subscription on their phone.

### What was done:

- Implemented the `revenuecat-webhook` Edge Function.
- Registered the Webhook URL in the RevenueCat dashboard.
- When a user buys "Bluprntai Pro", the webhook maps it to the `architect` plan and sets their `user_subscriptions` row to `active`.

### Troubleshooting:

> [!WARNING]
> If mobile users upgrade but their Web Dashboard still says "Free", the webhook failed. Check the [RevenueCat Webhook Logs](https://app.revenuecat.com) and the Supabase Edge Function logs for `revenuecat-webhook`.

---

## 4. Brevo Email Migration (Transactional Emails)

We replaced Resend with Brevo to take advantage of their generous 300 free emails/day tier.

### What was done:

- Stripped the heavy `resend` NPM package.
- Rewrote `supabase/functions/send-email/index.ts` to use a lightweight `fetch` request calling `https://api.brevo.com/v3/smtp/email`.
- Generated a secure API Key in the Brevo Dashboard and injected it into Supabase as `BREVO_API_KEY`.

### Troubleshooting:

> [!CAUTION]
> If emails are not arriving or landing in spam, verify your Domain Authentication settings in the Brevo dashboard. Ensure the `connect@monarch-labs.com` sender identity is approved.

---

## 5. Upstash Redis (Global Rate Limiting)

We established global DDoS protection for your AI and Email endpoints.

### What was done:

- Created a free Redis database in the US-East-1 region via Upstash.
- Injected `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into Supabase Edge Function secrets.
- The `_shared/rate-limit.ts` utility automatically detected these keys and switched from "Per-Server In-Memory limit" to a **Global Shared limit**.

### Troubleshooting:

> [!TIP]
> If users hit "Too many requests" errors constantly on the AI estimation tool, you can raise the global limit by using the Supabase CLI:
> `supabase secrets set RATE_LIMIT_REQUESTS=100`

---

## 6. Error Monitoring (Sentry)

We verified the Sentry setup for both Web and Mobile to ensure production crashes are captured and readable.

### What was done:

- **Project Verification**: Verified DSNs and project slugs for `bluprntai-mobile` and `bluprntai-web` in the `base83` Sentry organization.
- **Sourcemap Configuration**:
  - Updated `mobile/app.json` to include the Sentry Expo plugin with the correct `organization` and `project` slugs. This is required for EAS Build to upload sourcemaps so you can see the exact line of code that crashed.
  - Verified `vite.config.ts` has the `sentryVitePlugin` configured for the web build.
- **Identity Linking**: Confirmed that `Purchases.logIn(userId)` and `Sentry.setUser({ id: userId })` are called together in the mobile layout to link purchase history with crash reports.

### Troubleshooting:

> [!IMPORTANT]
> **Build Authentication**: You MUST provide a **`SENTRY_AUTH_TOKEN`** to your build environment (EAS Secret or Vercel Env) before running a production build, otherwise the sourcemap upload will fail.

> [!TIP]
> If you see "Minified" code in Sentry instead of your actual TypeScript, your SENTRY_AUTH_TOKEN was likely missing during the build process.

---

## 🚀 Final Steps Before Launch

1. Supply the final Test Account credentials in App Store Connect for Apple Reviewers.
2. Upload screenshots to the App Store listing.
3. Run `eas build --platform ios --profile production`.
