import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getServiceClient } from "../_shared/auth.ts";

/**
 * RevenueCat server webhook. Secured with Bearer REVENUECAT_WEBHOOK_AUTH_TOKEN.
 * Idempotent per event.id via revenuecat_webhook_events.
 */
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const secretToken = Deno.env.get("REVENUECAT_WEBHOOK_AUTH_TOKEN");

    if (!secretToken || authHeader !== `Bearer ${secretToken}`) {
      console.warn("Unauthorized webhook attempt.");
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = (await req.json()) as { event?: Record<string, unknown> };
    const event = payload.event;
    if (!event || typeof event !== "object") {
      return new Response(JSON.stringify({ error: "Missing event" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = event.app_user_id as string | undefined;
    const type = event.type as string | undefined;
    const expirationAt = event.expiration_at_ms
      ? new Date(Number(event.expiration_at_ms)).toISOString()
      : null;

    const entitlementIds = event.entitlement_ids as string[] | undefined;
    const hasPro = entitlementIds?.includes("Bluprntai Pro") ?? false;

    const eventId =
      typeof event.id === "string" && event.id.length > 0 ? event.id : null;

    const admin = getServiceClient();

    if (eventId) {
      const { data: existing } = await admin
        .from("revenuecat_webhook_events")
        .select("id")
        .eq("id", eventId)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ success: true, duplicate: true }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      const { error: insErr } = await admin
        .from("revenuecat_webhook_events")
        .insert({ id: eventId });
      if (insErr) {
        const { data: race } = await admin
          .from("revenuecat_webhook_events")
          .select("id")
          .eq("id", eventId)
          .maybeSingle();
        if (race) {
          return new Response(
            JSON.stringify({ success: true, duplicate: true }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        throw insErr;
      }
    }

    console.log(`Processing RevenueCat event ${type} for user ${userId}`);

    if (userId) {
      if (hasPro) {
        const { error } = await admin.from("user_subscriptions").upsert(
          {
            user_id: userId,
            status: type === "CANCELLATION" ? "canceled" : "active",
            current_period_end: expirationAt,
            plan: "architect",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (error) throw error;
      } else if (type === "EXPIRATION" || type === "CANCELLATION") {
        const { error } = await admin
          .from("user_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) throw error;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
