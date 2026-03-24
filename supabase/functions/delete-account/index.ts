import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient, getUserIdFromRequest } from "../_shared/auth.ts";
import { logEdge } from "../_shared/log.ts";

const PROJECT_DOCUMENTS_BUCKET = "project-documents";
const STORAGE_REMOVE_BATCH = 100;

/**
 * Deletes the authenticated user's account and associated data: Postgres rows,
 * objects in `project-documents`, and (when `STRIPE_SECRET_KEY` is set) the
 * Stripe subscription and customer for this user. Irreversible.
 */
async function removeStorageForProjects(
  admin: SupabaseClient,
  projectIds: string[],
): Promise<void> {
  if (projectIds.length === 0) return;

  const { data: docs } = await admin
    .from("documents")
    .select("storage_path")
    .in("project_id", projectIds);
  const { data: packets } = await admin
    .from("seller_packets")
    .select("storage_path")
    .in("project_id", projectIds);

  const paths = [
    ...(docs ?? []).map((d) => d.storage_path),
    ...(packets ?? []).map((p) => p.storage_path),
  ].filter((p): p is string => typeof p === "string" && p.length > 0);

  const unique = [...new Set(paths)];
  for (let i = 0; i < unique.length; i += STORAGE_REMOVE_BATCH) {
    const batch = unique.slice(i, i + STORAGE_REMOVE_BATCH);
    const { error } = await admin.storage.from(PROJECT_DOCUMENTS_BUCKET).remove(batch);
    if (error) {
      logEdge("error", "delete-account storage remove batch failed", {
        error: String(error.message),
      });
    }
  }
}

async function cancelStripeForUser(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const secret = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  if (!secret) return;

  const { data: subRow } = await admin
    .from("user_subscriptions")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!subRow) return;

  const stripe = new Stripe(secret, { apiVersion: "2023-10-16" });

  if (subRow.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(subRow.stripe_subscription_id);
    } catch (e) {
      logEdge("warn", "delete-account Stripe subscription cancel", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (subRow.stripe_customer_id) {
    try {
      await stripe.customers.del(subRow.stripe_customer_id);
    } catch (e) {
      logEdge("warn", "delete-account Stripe customer delete", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse({ error: "Please sign in to delete your account." }, 401, req);
  }

  try {
    const admin = getServiceClient();

    await cancelStripeForUser(admin, userId);

    const { data: props } = await admin
      .from("properties")
      .select("id")
      .eq("owner_user_id", userId);
    const propertyIds = (props ?? []).map((p) => p.id);

    if (propertyIds.length > 0) {
      const { data: projs } = await admin
        .from("projects")
        .select("id")
        .in("property_id", propertyIds);
      const projectIds = (projs ?? []).map((p) => p.id);

      await removeStorageForProjects(admin, projectIds);

      for (const pid of projectIds) {
        const { data: invs } = await admin.from("invoices").select("id").eq("project_id", pid);
        const invIds = (invs ?? []).map((i) => i.id);
        if (invIds.length > 0) {
          await admin.from("invoice_line_items").delete().in("invoice_id", invIds);
        }
        await admin.from("invoices").delete().eq("project_id", pid);
        await admin.from("documents").delete().eq("project_id", pid);
        await admin.from("scope_items").delete().eq("project_id", pid);
        await admin.from("project_view_tokens").delete().eq("project_id", pid);
        await admin.from("seller_packets").delete().eq("project_id", pid);
      }

      await admin.from("projects").delete().in("property_id", propertyIds);
      await admin.from("properties").delete().eq("owner_user_id", userId);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      logEdge("error", "delete-account auth.admin.deleteUser failed", {
        error: String(delErr.message),
      });
      return jsonResponse({ error: "Could not complete account deletion." }, 500, req);
    }

    return jsonResponse({ success: true }, 200, req);
  } catch (e) {
    logEdge("error", "delete-account unexpected", {
      error: e instanceof Error ? e.message : String(e),
    });
    return jsonResponse(
      { error: "Something went wrong. Please try again." },
      500,
      req,
    );
  }
});
