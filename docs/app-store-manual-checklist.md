# App Store — tasks you complete outside the repo

The app now shows clearer in-app messages when purchases, offerings, or restore fail. Use this list for **your** Apple / business / store steps (nothing here is automated in code).

## Apple Developer & App Store Connect

1. **Account Holder**: Sign the current **Apple Developer Program License Agreement** at [developer.apple.com/account](https://developer.apple.com/account).
2. **Paid Apps**: In [App Store Connect → Business](https://appstoreconnect.apple.com/business/), complete **Set Up Tax and Banking** until **Paid Apps** is **Active**.
3. **Subscriptions & IAP**: Confirm **Architect (monthly)** and **Project Pass (lifetime)** reach **Ready for Review** / **Approved** (not blocked by agreements). See also [APP_STORE_SETUP_REQUIRED.md](APP_STORE_SETUP_REQUIRED.md).
4. **Propagation**: After agreement changes, wait **2–4 hours** (sometimes longer) before expecting products to load in TestFlight.

## App Store listing (you or marketing)

5. **Screenshots** and **description** for the current build.
6. **Support URL** and **Marketing URL** — must load real pages (e.g. `bluprnt.ai/support`).
7. **Privacy Policy URL** — must match what’s in the app and in App Store Connect.
8. **Export compliance** questionnaire — answer accurately for your encryption use.
9. **Age rating** and **review notes** (Sandbox test account if Apple requests it).

## RevenueCat & backend (dashboard / Supabase)

10. **RevenueCat**: Apple `.p8` key uploaded; products and entitlements match App Store Connect and the app.
11. **RevenueCat webhook** to Supabase: `REVENUECAT_WEBHOOK_AUTH_TOKEN` set in Edge secrets; watch logs after first real purchases.
12. **TestFlight**: Run one **production** EAS iOS build, install via TestFlight, walk through sign-up → **Restore** / **purchase** with a **Sandbox** Apple ID.

## Optional follow-up in repo later

- Android / Play: repeat RevenueCat + Play Console when you launch on Google Play (see [production_launch_handbook.md](production_launch_handbook.md)).
