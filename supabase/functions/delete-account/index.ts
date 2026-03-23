import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient, getUserIdFromRequest } from "../_shared/auth.ts";

/**
 * Deletes the authenticated user's account and all associated data.
 * Requires valid JWT. Irreversible.
 */
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
      console.error(delErr);
      return jsonResponse({ error: "Could not complete account deletion." }, 500, req);
    }

    return jsonResponse({ success: true }, 200, req);
  } catch (e) {
    console.error(e);
    return jsonResponse(
      { error: "Something went wrong. Please try again." },
      500,
      req,
    );
  }
});
