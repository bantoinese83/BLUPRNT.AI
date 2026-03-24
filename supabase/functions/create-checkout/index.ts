import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserIdFromRequest } from "../_shared/auth.ts";
import { logEdge } from "../_shared/log.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }

    const body = (await req.json().catch(() => null)) as {
      priceId?: string;
      projectId?: string;
    } | null;
    const priceId =
      typeof body?.priceId === "string" ? body.priceId.trim() : "";
    const projectId =
      typeof body?.projectId === "string" ? body.projectId.trim() : "";

    if (!priceId) {
      return jsonResponse({ error: "Missing priceId" }, 400, req);
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
    if (!stripeSecret) {
      logEdge("error", "create-checkout missing STRIPE_SECRET_KEY", {});
      return jsonResponse(
        { error: "Checkout is not configured. Please try again later." },
        503,
        req,
      );
    }

    // Prefer Stripe Price metadata over duplicating Architect price id in Edge secrets.
    const legacyArchitectId = Deno.env.get("STRIPE_ARCHITECT_PRICE_ID")?.trim();
    let mode: "subscription" | "payment";
    if (legacyArchitectId && priceId === legacyArchitectId) {
      mode = "subscription";
    } else {
      try {
        const price = await stripe.prices.retrieve(priceId);
        mode = price.type === "recurring" ? "subscription" : "payment";
      } catch (e) {
        logEdge("error", "create-checkout price retrieve failed", {
          detail: e instanceof Error ? e.message : String(e),
        });
        return jsonResponse(
          {
            error:
              "That plan isn't available right now. Please refresh and try again.",
          },
          400,
          req,
        );
      }
    }

    const origin = req.headers.get("origin") ?? "";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        userId,
        project_id: projectId,
      },
      allow_promotion_codes: true,
    });

    return jsonResponse({ url: session.url }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    logEdge("error", "create-checkout failed", {
      detail: error instanceof Error ? error.stack : String(error),
    });
    return jsonResponse({ error: message }, 500, req);
  }
});
