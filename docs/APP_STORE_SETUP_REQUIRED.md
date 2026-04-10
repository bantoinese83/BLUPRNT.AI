# 🍎 App Store Connect: Required Actions

This document outlines the final manual steps required by the **Account Holder** to enable In-App Purchases and Subscriptions for the BLUPRNT mobile app. These steps cannot be performed by an AI or a developer-level account.

## 1. Accept License Agreement

Apple has updated the **Apple Developer Program License Agreement**. All other business features are blocked until this is accepted.

1.  Log in to [developer.apple.com/account](https://developer.apple.com/account) as the **Account Holder**.
2.  Review and accept the updated legal terms shown in the banner.

## 2. Activate Paid Apps Agreement

Once the main license is signed, you must enable your ability to receive payments.

1.  Go to [App Store Connect > Business](https://appstoreconnect.apple.com/business/).
2.  Look for the **Paid Apps** agreement.
3.  Click **Set Up Tax and Banking**.
4.  Enter your banking information and tax forms as required by Apple.
5.  Wait for the status to change to **Active**.

## 3. Verify Product Status

I have already configured the products and linked them to Version 1.0. Once the agreements above are active, verify the status here:

- **Architect (Monthly)**: [Subscriptions Section](https://appstoreconnect.apple.com/apps/6761769731/app-store/features/subscriptions/)
- **Project Pass (Lifetime)**: [In-App Purchases Section](https://appstoreconnect.apple.com/apps/6761769731/app-store/features/in-app-purchases/)

Both should eventually show **Ready for Review** or **Approved** instead of being blocked.

## 4. Test in Mobile App

Once the status is **Active**, the `Error fetching offerings (error 1)` in the mobile logs will disappear, and the paywall will display your products.

> [!NOTE]
> It can take up to **2-4 hours** for Apple to propagate these changes to the RevenueCat fetchers after you sign the agreements.
