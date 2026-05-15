import "@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient, getUserIdFromRequest } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { logEdge } from "../_shared/log.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
});

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = await checkRateLimit(req);
  if (!ok) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      429,
      req,
      retryAfter ?? 60,
    );
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }

    const admin = getServiceClient();
    const { data: sub, error: subErr } = await admin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (subErr) {
      logEdge("error", "create-portal-session: failed to fetch user_subscriptions", {
        userId,
        error: subErr.message,
      });
      return jsonResponse({ error: "Failed to retrieve billing info" }, 500, req);
    }

    if (!sub?.stripe_customer_id) {
      return jsonResponse(
        { error: "No active billing account found. Upgrade first to manage your plan." },
        400,
        req,
      );
    }

    const origin = req.headers.get("origin") ?? Deno.env.get("SITE_URL") ?? "";
    
    // Create a Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    return jsonResponse({ url: session.url }, 200, req);
  } catch (error) {
    logEdge("error", "create-portal-session: failed", {
      detail: error instanceof Error ? error.stack : String(error),
    });
    return jsonResponse({ error: "Failed to open billing portal" }, 500, req);
  }
});
