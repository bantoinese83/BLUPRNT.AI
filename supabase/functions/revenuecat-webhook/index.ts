import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * RevenueCat Webhook Handler
 * Syncs App Store/Play Store entitlements to the internal `user_subscriptions` table.
 */
serve(async (req) => {
  try {
    // 1. Authentication (Optional Header check)
    if (webhookSecret) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const { event } = await req.json();
    const { type, app_user_id, product_id, expiration_at_ms, period_type } =
      event;

    if (!app_user_id) {
      return new Response("No app_user_id provided", { status: 400 });
    }

    console.log(`[RevenueCat] Event: ${type} for User: ${app_user_id}`);

    // 2. Map RevenueCat status to internal DB status
    let status = "active";
    if (type === "EXPIRATION" || type === "CANCELLATION") {
      status = "canceled";
    } else if (type === "BILLING_ISSUE") {
      status = "past_due";
    }

    const periodEnd = expiration_at_ms
      ? new Date(expiration_at_ms).toISOString()
      : null;

    // 3. Sync to `user_subscriptions`
    // We use a service role client to bypass RLS for administrative sync.
    const { error } = await supabase.from("user_subscriptions").upsert(
      {
        user_id: app_user_id,
        status: status,
        current_period_end: periodEnd,
        // product_id can be mapped to our 'architect' plan if needed
        plan: "architect",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("[RevenueCat] Sync Error:", error);
      return new Response("Internal Error", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[RevenueCat] Unexpected error:", err);
    return new Response("Bad Request", { status: 400 });
  }
});
