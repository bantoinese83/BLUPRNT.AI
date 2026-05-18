import { createClient } from "@supabase/supabase-js";
import {
  isProjectPassStoreProduct,
  mapRcEventToStatus,
  projectIdFromRcEvent,
  projectPassExpiresAtIso,
  rcEntitlementActiveForEvent,
  type RcWebhookEvent,
} from "./logic.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = (
  Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ||
  Deno.env.get("REVENUECAT_WEBHOOK_AUTH_TOKEN") ||
  ""
).trim();

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * RevenueCat Webhook Handler
 * Syncs App Store/Play entitlements. When the user also has Stripe (web),
 * we only update `revenuecat_entitlement_active` so we never clobber Stripe-driven status.
 *
 * Project Pass (lifetime) writes `project_passes` for the project in subscriber attributes.
 * Architect (monthly) writes `user_subscriptions`.
 *
 * Required secret: REVENUECAT_WEBHOOK_SECRET (set in Supabase Edge Function secrets).
 */
Deno.serve(async (req: Request) => {
  try {
    if (!webhookSecret) {
      console.error(
        "[RevenueCat] REVENUECAT_WEBHOOK_SECRET is not configured. Set this secret in the Supabase dashboard.",
      );
      return new Response("Webhook not configured", { status: 503 });
    }

    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { event } = (await req.json()) as { event: RcWebhookEvent };
    const { type, app_user_id, expiration_at_ms, product_id } = event;

    if (!app_user_id) {
      return new Response("No app_user_id provided", { status: 400 });
    }

    console.log(
      `[RevenueCat] Event: ${type} product=${product_id ?? "unknown"} user=${app_user_id}`,
    );

    const entitlementActive = rcEntitlementActiveForEvent(type);

    if (isProjectPassStoreProduct(product_id) && entitlementActive) {
      const projectId = projectIdFromRcEvent(event);
      if (!projectId) {
        console.warn(
          "[RevenueCat] Project Pass purchase missing subscriber attribute project_id",
        );
        return new Response("OK", { status: 200 });
      }

      const { data: ownedProject } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("user_id", app_user_id)
        .maybeSingle();

      if (!ownedProject) {
        console.warn(
          `[RevenueCat] Project Pass rejected: project ${projectId} is not owned by ${app_user_id}`,
        );
        return new Response("OK", { status: 200 });
      }

      const purchasedAt = new Date().toISOString();
      const { error: passErr } = await supabase.from("project_passes").upsert(
        {
          project_id: projectId,
          purchased_at: purchasedAt,
          expires_at: projectPassExpiresAtIso(),
        },
        { onConflict: "project_id" },
      );

      if (passErr) {
        console.error("[RevenueCat] project_passes upsert error:", passErr);
        return new Response("Internal Error", { status: 500 });
      }

      return new Response("OK", { status: 200 });
    }

    const periodEnd = expiration_at_ms
      ? new Date(expiration_at_ms).toISOString()
      : null;

    const status = mapRcEventToStatus(type);
    const rcEntitlementActive = entitlementActive;

    const { data: existing } = await supabase
      .from("user_subscriptions")
      .select("user_id, stripe_subscription_id")
      .eq("user_id", app_user_id)
      .maybeSingle();

    const hasStripe = Boolean(existing?.stripe_subscription_id);

    if (hasStripe) {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          revenuecat_entitlement_active: rcEntitlementActive,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", app_user_id);

      if (error) {
        console.error("[RevenueCat] Stripe co-existence update error:", error);
        return new Response("Internal Error", { status: 500 });
      }
      return new Response("OK", { status: 200 });
    }

    const { error } = await supabase.from("user_subscriptions").upsert(
      {
        user_id: app_user_id,
        status,
        current_period_end: periodEnd,
        plan: "architect",
        revenuecat_entitlement_active: rcEntitlementActive,
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
