# Web app — Lighthouse (local)

This document explains how to run [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) against the **production** Vite build in this repo, what artifacts are produced, and what we optimize for.

## Run from the repository root

```bash
npm run lighthouse:mobile    # throttled mobile emulation (default lab profile)
npm run lighthouse:desktop   # desktop emulation (--preset=desktop)
```

These invoke [`scripts/lighthouse-local.sh`](../scripts/lighthouse-local.sh), which:

1. Cleans `web/dist` (via `npm run clean -w web` or `rm -rf web/dist`) and runs **`npm run build:web`**.
2. Serves the built app with **`vite preview`** on **`http://127.0.0.1:4178/`** (override with `LIGHTHOUSE_PORT`).
3. Runs **`npx lighthouse@12`** headless against `/`, categories: performance, accessibility, best practices, SEO.
4. Writes **`web/lighthouse-report.report.html`** and **`web/lighthouse-report.report.json`** (both are **gitignored**).

## Interpreting scores

- **Accessibility, best practices, and SEO** are expected to reach **100** on both presets when run against a clean local preview.
- **Performance** varies with CPU load and Lighthouse version. **Desktop** lab scores are typically in the **high 90s**; **mobile** uses aggressive CPU/network throttling and scores **lower** for the same app. A single SPA with React, Supabase, and marketing motion will not reliably hit **100** performance on the mobile preset without larger architectural changes (for example prerendering or stripping libraries from the `/` critical path).

Use the HTML report for **specific audits** (LCP element, unused JavaScript, render-blocking resources) rather than chasing a single number.

## Implementation notes (maintainers)

The following choices support Lighthouse and real-user performance on the marketing home page:

- **No `motion` opacity hide on LCP**: Hero heading and imagery must not wait on Motion’s initial `opacity: 0` state, or LCP moves late.
- **Below-the-fold landing sections** load from a lazy chunk (`LandingBelowFold`) so the first navigation parses less JavaScript.
- **jsPDF** is loaded only via **dynamic `import()`** inside `generateSellerPacketBlob`, with **`import type`** for typings. Do **not** reintroduce a shared **`manualChunks` bundle** that merges Vite’s preload helper with jsPDF, or the **entry** script will pull the entire PDF stack on every route (including `/`).
- **Canonical and social metadata** for `/` are applied via **react-helmet-async** in `Landing.tsx` so preview hosts match production behavior.

If you change the landing route, re-run both presets and confirm accessibility and SEO audits still pass.
