-- Track RevenueCat (App Store / Play) entitlement separately from Stripe so we can
-- detect users who may be paying on both web and mobile stores.

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS revenuecat_entitlement_active boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_subscriptions.revenuecat_entitlement_active IS
  'True when RevenueCat reports an active mobile store subscription for this user.';
