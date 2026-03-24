# Quality Hardening Rollout Checklist

## Pre-deploy

- Ensure latest migrations are applied in Supabase.
- Confirm Edge secrets are set (`GEMINI_API_KEY`, Stripe keys, CORS origins).
- Run local checks:
  - `npm run lint`
  - `npm run test:run`
  - `bash scripts/check-edge-functions.sh`

## Deploy order

1. Deploy Edge functions (`photo-to-scope`, `upload-invoice`, `get-invoice`, `create-checkout`, `stripe-webhook`).
2. Deploy frontend.
3. Run `bash scripts/post-deploy-verify.sh`.

## Post-deploy verification

- Landing renders without runtime errors and key CTA routes work.
- Onboarding estimate:
  - Photo + text path returns summary.
  - Text-only fallback still works.
- Dashboard invoice upload remains available.
- Reduced-motion mode disables high-intensity shader/highlighter animation.

## Rollback triggers

- Estimate generation failure rate spikes > 5% for 10 minutes.
- Error boundary events increase > 3x baseline.
- Checkout initiation or webhook processing failures increase > 2x baseline.

## Rollback steps

1. Re-deploy previous frontend artifact.
2. Re-deploy previous Edge function versions.
3. Verify onboarding and billing flows with smoke script.
