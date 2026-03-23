import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { getServiceClient } from "../_shared/auth.ts";

/**
 * Stripe webhook handler. Verify signature, process events.
 * Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Supabase Edge Function secrets.
 */
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-11-20",
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("Stripe-Signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!signature || !secret) {
    return new Response("Webhook not configured", { status: 500 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      secret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    return new Response((err as Error).message, { status: 400 });
  }

  const admin = getServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerEmail = session.customer_email ?? session.customer_details?.email;

        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          let targetUserId = userId;
          if (!targetUserId && customerEmail) {
            const { data: rpcUserId, error: rpcErr } = await admin.rpc("get_user_id_by_email", {
              user_email: customerEmail,
            });
            if (rpcErr) console.error("RPC get_user_id_by_email:", rpcErr);
            targetUserId = rpcUserId;
          }

          if (targetUserId) {
            await admin.from("user_subscriptions").upsert(
              {
                user_id: targetUserId,
                stripe_subscription_id: subId,
                stripe_customer_id:
                  typeof session.customer === "string"
                    ? session.customer
                    : session.customer?.id ?? null,
                plan: "architect",
                status: "active",
                current_period_end: periodEnd,
                invoice_uploads_count: 0,
                invoice_uploads_reset_at: periodEnd,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
          }
        } else if (session.mode === "payment" && session.metadata?.project_id) {
          const projectId = session.metadata.project_id;
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 6);

          await admin.from("project_passes").upsert(
            {
              project_id: projectId,
              stripe_checkout_session_id: session.id,
              purchased_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            },
            { onConflict: "project_id" }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        const status = subscription.status === "active" ? "active"
          : subscription.status === "canceled" ? "canceled"
          : subscription.status === "past_due" ? "past_due"
          : "trialing";

        await admin
          .from("user_subscriptions")
          .update({
            status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await admin
          .from("user_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error("Webhook processing error:", e);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
