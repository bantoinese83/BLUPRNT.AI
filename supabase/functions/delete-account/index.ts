import "jsr:@supabase/functions-js@2.100.0/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient, getUserIdFromRequest } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { logEdge } from "../_shared/log.ts";

const PROJECT_DOCUMENTS_BUCKET = "project-documents";
const PROJECT_PHOTOS_BUCKET = "project-photos";
const STORAGE_REMOVE_BATCH = 100;

async function removeBucketPrefixRecursive(
  admin: SupabaseClient,
  bucketId: string,
  prefix: string,
  depth = 0,
): Promise<void> {
  if (depth > 5) {
    logEdge("warn", "delete-account storage recursion too deep", {
      bucket: bucketId,
      prefix,
    });
    return;
  }

  const { data: items, error } = await admin.storage
    .from(bucketId)
    .list(prefix, { limit: 500 });
  if (error) {
    logEdge("warn", "delete-account storage list", {
      bucket: bucketId,
      prefix,
      detail: String(error.message),
    });
    return;
  }
  if (!items?.length) return;

  const filePaths: string[] = [];
  for (const item of items) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    // folder-like items in Supabase Storage list often have null metadata
    if (item.metadata == null) {
      await removeBucketPrefixRecursive(admin, bucketId, path, depth + 1);
    } else {
      filePaths.push(path);
    }
  }
  if (filePaths.length === 0) return;
  for (let i = 0; i < filePaths.length; i += STORAGE_REMOVE_BATCH) {
    const batch = filePaths.slice(i, i + STORAGE_REMOVE_BATCH);
    const { error: rmErr } = await admin.storage.from(bucketId).remove(batch);
    if (rmErr) {
      logEdge("warn", "delete-account storage remove", {
        bucket: bucketId,
        detail: String(rmErr.message),
      });
    }
  }
}

async function removePhotosForProjects(
  admin: SupabaseClient,
  projectIds: string[],
): Promise<void> {
  await Promise.all(
    projectIds.map((pid) =>
      removeBucketPrefixRecursive(admin, PROJECT_PHOTOS_BUCKET, pid)
    ),
  );
}

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
    const { error } = await admin.storage
      .from(PROJECT_DOCUMENTS_BUCKET)
      .remove(batch);
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

export const handler = async (req: Request) => {
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

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse(
      { error: "Please sign in to delete your account." },
      401,
      req,
    );
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
      await removePhotosForProjects(admin, projectIds);

      const { data: invs } = await admin
        .from("invoices")
        .select("id")
        .in("project_id", projectIds);
      const invIds = (invs ?? []).map((i) => i.id);

      if (invIds.length > 0) {
        await admin
          .from("invoice_line_items")
          .delete()
          .in("invoice_id", invIds);
      }

      await Promise.all([
        admin.from("invoices").delete().in("project_id", projectIds),
        admin.from("documents").delete().in("project_id", projectIds),
        admin.from("scope_items").delete().in("project_id", projectIds),
        admin.from("project_view_tokens").delete().in("project_id", projectIds),
        admin.from("seller_packets").delete().in("project_id", projectIds),
      ]);

      await admin.from("projects").delete().in("property_id", propertyIds);
      await admin.from("properties").delete().eq("owner_user_id", userId);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      logEdge("error", "delete-account auth.admin.deleteUser failed", {
        error: String(delErr.message),
      });
      return jsonResponse(
        { error: "Could not complete account deletion." },
        500,
        req,
      );
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
};

if (import.meta.main) {
  Deno.serve(handler);
}
