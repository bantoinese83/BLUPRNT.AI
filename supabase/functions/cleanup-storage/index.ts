import "jsr:@supabase/functions-js@2.100.0/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = handleOptions(req);
  if (corsHeaders) return corsHeaders;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  try {
    const { storage_path } = await req.json();

    if (!storage_path) {
      return jsonResponse({ error: "Missing storage_path" }, 400, req);
    }

    // We use the Service Role client because this is a system-triggered cleanup
    // triggered by a DB trigger via pg_net.
    const admin = getServiceClient();

    const { error: storageErr } = await admin.storage
      .from("project-documents")
      .remove([storage_path]);

    if (storageErr) {
      console.error("[cleanup-storage] Removal failed:", storageErr);
      return jsonResponse({ error: storageErr.message }, 500, req);
    }

    console.log(`[cleanup-storage] Successfully removed: ${storage_path}`);
    return jsonResponse({ success: true }, 200, req);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[cleanup-storage] Critical Failure:", message);
    return jsonResponse({ error: message }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
