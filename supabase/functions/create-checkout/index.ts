import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getUserIdFromRequest } from "../_shared/auth.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-11-20",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { priceId, projectId, promoCode } = await req.json();

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Missing priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine mode based on price type or naming (if needed)
    // For our specific use case, we know Architect is a subscription
    const ARCHITECT_PRICE_ID = "price_1TEDh3DScOjm3APoyO5zBb73";
    const mode = priceId === ARCHITECT_PRICE_ID ? "subscription" : "payment";

    const sessionParam: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${req.headers.get("origin")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard`,
      metadata: {
        userId,
        project_id: projectId ?? "",
      },
    };

    // If it's a project pass, we need to make sure we don't apply subscription logic
    if (mode === "payment") {
       sessionParam.allow_promotion_codes = true;
    } else {
       // For subscriptions, we can also allow promo codes
       sessionParam.allow_promotion_codes = true;
    }

    // Note: If the user explicitly passed a promoCode we wanted to auto-apply, 
    // we'd use discounts: [{ coupon: '...' }] but allow_promotion_codes is more flexible for the UI.

    const session = await stripe.checkout.sessions.create(sessionParam);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
