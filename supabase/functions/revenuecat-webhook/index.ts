import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const { event } = await req.json();

    const userId = event.app_user_id;
    const type = event.type;
    const expirationAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    // We care about "Bluprntai Pro" entitlement
    const hasPro = event.entitlement_ids?.includes("Bluprntai Pro");

    console.log(`Processing RevenueCat event ${type} for user ${userId}`);

    if (userId) {
      if (hasPro) {
        // Upsert subscription status
        const { error } = await supabase.from("user_subscriptions").upsert(
          {
            user_id: userId,
            status: type === "CANCELLATION" ? "canceled" : "active",
            current_period_end: expirationAt,
            plan: "architect", // Mapping 'Bluprntai Pro' to the internal 'architect' plan
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (error) throw error;
      } else if (type === "EXPIRATION" || type === "CANCELLATION") {
        // Mark as canceled/expired
        const { error } = await supabase
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
