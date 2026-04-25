import "@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "stripe";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { logEdge } from "../_shared/log.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
});

/** Price IDs permitted for Checkout (Edge secrets — not VITE_*). */
function resolveAllowedPriceIds(): Set<string> {
  const ids = new Set<string>();
  for (
    const key of [
      "STRIPE_ARCHITECT_PRICE_ID",
      "STRIPE_PROJECT_PASS_PRICE_ID",
    ] as const
  ) {
    const v = Deno.env.get(key)?.trim();
    if (v) {
      ids.add(v);
    }
  }
  const extra = Deno.env.get("STRIPE_ALLOWED_PRICE_IDS")?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const t = part.trim();
      if (t) {
        ids.add(t);
      }
    }
  }
  return ids;
}

function getSafeOrigin(req: Request): string {
  const origin = req.headers.get("origin") ?? "";
  const allowed = Deno.env.get("ALLOWED_ORIGINS")?.trim();
  if (!allowed) return origin || Deno.env.get("SITE_URL") || "";
  const origins = allowed
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.includes(origin)) return origin;
  return origins[0] || "";
}

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

    const body = (await req.json().catch(() => null)) as {
      priceId?: string;
      projectId?: string;
    } | null;
    const priceId = typeof body?.priceId === "string"
      ? body.priceId.trim()
      : "";
    const projectId = typeof body?.projectId === "string"
      ? body.projectId.trim()
      : "";

    if (!priceId) {
      return jsonResponse({ error: "Missing priceId" }, 400, req);
    }

    // If a projectId is supplied, verify the authenticated user owns it before
    // creating a checkout session on their behalf. This prevents any user from
    // purchasing a Project Pass for someone else's project.
    if (projectId) {
      const admin = getServiceClient();
      try {
        await assertProjectOwner(admin, projectId, userId);
      } catch (ownershipErr) {
        const msg = (ownershipErr as Error).message;
        if (msg === "forbidden") {
          return jsonResponse(
            {
              error: "You don't have permission to purchase for that project.",
            },
            403,
            req,
          );
        }
        return jsonResponse(
          { error: "Project not found. Please refresh and try again." },
          404,
          req,
        );
      }
    }

    const allowedPrices = resolveAllowedPriceIds();
    if (allowedPrices.size === 0) {
      logEdge("error", "create-checkout missing price allowlist env", {});
      return jsonResponse(
        {
          error: "Checkout is not configured. Please try again later.",
        },
        503,
        req,
      );
    }
    if (!allowedPrices.has(priceId)) {
      return jsonResponse(
        {
          error:
            "That plan isn't available right now. Please refresh and try again.",
        },
        400,
        req,
      );
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

    const origin = getSafeOrigin(req);

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
    logEdge("error", "create-checkout failed", {
      detail: error instanceof Error ? error.stack : String(error),
    });
    return jsonResponse(
      { error: "Checkout failed. Please try again." },
      500,
      req,
    );
  }
});
