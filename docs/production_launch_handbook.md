# BLUPRNT.AI Production Launch Handbook

This document serves as the master record of the production hardening process completed prior to the launch of BLUPRNT.AI. It contains all critical configuration steps, API setups, and troubleshooting guides for the infrastructure powering the platform.

---

## 1. App Store Connect & RevenueCat (Mobile Monetization)

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

## 2. Stripe Integration (Web Monetization)

We ensured the Web Application's checkout flow is identically synced with the native mobile app subscriptions.

### What was done:

- **Pricing Ties**: Set the `VITE_STRIPE_ARCHITECT_PRICE_ID` in the root `.env` to map directly to the "Bluprntai Pro" tier.
- **Backend Secrets**: Required `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to be deployed to the Supabase Edge Functions (`create-checkout` and `stripe-webhook`).
- **Webhooks**: Ensured Stripe securely broadcasts subscription upgrades and cancellations directly to the user's row in `user_subscriptions` via Edge Functions.

---

## 3. Supabase Backend Sync & Hardening

We ensured the local database schema and edge functions exactly match the live production environment.

### What was done:

- **Edge Functions**: Deployed all 11 Edge Functions to `elucgaegaihkklnfoasm`.
- **Database Sync**: Pushed all custom RPCs and SQL migrations to production, including TypeScript `supabase.gen.ts` typings for Web and Mobile.
- **Secure Storage**: Created two new private storage buckets: `project-documents` (for PDF invoices/quotes) and `project-photos` (for Gemini vision processing).
- **Storage RLS**: Enabled strict Row Level Security on the storage buckets so users can only read/write files located inside their own `project_id` folder.

---

## 4. RevenueCat Database Sync (Webhooks)

We configured RevenueCat to tell the Supabase database whenever someone buys or cancels a subscription on their phone.

### What was done:

- Implemented the `revenuecat-webhook` Edge Function.
- Registered the Webhook URL in the RevenueCat dashboard.
- **Security Lockdown**: Implemented an Authorization bearer token requirement (`REVENUECAT_WEBHOOK_AUTH_TOKEN`) inside the webhook function to prevent unauthenticated POST requests from upgrading user accounts for free.
- When a user buys "Bluprntai Pro", the webhook maps it to the `architect` plan and sets their `user_subscriptions` row to `active`.

### Troubleshooting:

> [!WARNING]
> If mobile users upgrade but their Web Dashboard still says "Free", the webhook failed. Check the [RevenueCat Webhook Logs](https://app.revenuecat.com) and the Supabase Edge Function logs for `revenuecat-webhook` and verify `REVENUECAT_WEBHOOK_AUTH_TOKEN` is synced properly.

---

## 5. Brevo Email Migration (Transactional Emails)

We replaced Resend with Brevo for scalable transactional email processing.

### What was done:

- Rewrote `supabase/functions/send-email/index.ts` to use a lightweight `fetch` request calling `https://api.brevo.com/v3/smtp/email`.
- Generated a secure API Key in the Brevo Dashboard and injected it into Supabase as `BREVO_API_KEY`.

---

## 6. Upstash Redis (Global Rate Limiting)

We established global DDoS protection for your AI and Email endpoints.

### What was done:

- Created a free Redis database in the US-East-1 region via Upstash.
- Injected `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into Supabase Edge Function secrets.
- The `_shared/rate-limit.ts` utility automatically detected these keys and switched from "Per-Server In-Memory limit" to a **Global Shared limit**.

---

## 7. Error Monitoring & Telemetry (Sentry)

We verified the Sentry setup for both Web and Mobile to ensure production crashes are captured and readable.

### What was done:

- **Web Verification**: Web is fully instrumented via `src/instrument.ts` routing to the `bluprntai-web` project using `VITE_SENTRY_DSN`.
- **Mobile Verification**: Updated `mobile/app.json` to include the Sentry Expo plugin with the correct `organization` and `project` slugs.
- **Identity Linking**: Confirmed that `Purchases.logIn(userId)` and `Sentry.setUser({ id: userId })` are called together in the mobile layout to link purchase history with crash reports.

---

## 8. Expo EAS Build Pipeline

The final step was automating App Store submission directly from the developer environment.

### What was done:

- **EAS Config**: Built the `mobile/eas.json` schema to govern development, preview, and production builds.
- **App Store Connect Keys**: Generated an `AscApiKey.p8` with Admin permissions in App Store Connect and safely uploaded it into Expo Settings to automate code signing, certificates, and TestFlight submissions.
- **Project Linkage**: Assigned `"owner": "mlabs83"` to `mobile/app.json` to guarantee all EAS CLI commands correctly target the production cloud dashboard.

---

---

## 9. Mobile UX & Hardening Polish

The final phase of the mobile app focus was on "Day 1" user experience and stability.

### What was done:
- **Branded Splash**: Re-enabled `BrandedSplash` in `_layout.tsx` to handle the transition between native boot and JS loading. Hiding of the splash screen is now gated by font and asset loading.
- **Dynamic Versioning**: Replaced hardcoded version strings on the Profile screen with `expo-constants`. The app now automatically displays the correct `version` and `buildNumber` from `app.json`.
- **Micro-animations**: Enhanced the onboarding flow with `moti` transitions (slides and fades) for phase labels and step content, providing a more premium, AI-native feel.
- **Analytics Fallback**: Implemented a Sentry breadcrumb fallback in `trackProductEvent` for production builds, ensuring observability even before a dedicated analytics SDK is integrated.

---

## 10. Web Production & SEO Hardening

We finalized the web application to ensure it is as polished and discoverable as the mobile app.

### What was done:
- **Canonical Redirects**: Updated `vercel.json` to enforce `https://bluprntai.com`. All `www` traffic is now consolidated on the root domain to maximize SEO authority.
- **SEO Page Titles**: Integrated `Helmet` on the Dashboard and Project views to show descriptive, context-aware browser tab titles (e.g., "Financial Dashboard | BLUPRNT.AI").
- **A11y (Accessibility)**: Conducted an audit of the Landing Header and Footer to ensure all images have proper `alt` tags and navigation is keyboard-accessible.
- **Chunk Recovery**: Confirmed that `main.tsx` includes automatic reload logic for chunk loading failures, preventing stale sessions after new code deployments.

---

## 11. Final Checklist & Submission

1. **Mobile**: Run `npx eas build --profile production --platform ios` and then `eas submit --latest`.
2. **Web**: Any push to `main` will automatically trigger a Vercel deployment with the new SEO and redirect rules.
3. **Legal**: Direct users to `bluprnt.ai/privacy` and `bluprnt.ai/terms` for the final Apple review pass.

---
*Last updated: April 18, 2026*
