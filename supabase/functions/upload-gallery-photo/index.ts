import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";

export const handler = async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, req);
    }

    const { ok, retryAfter } = await checkRateLimit(req);
    if (!ok) {
      return jsonResponse({ error: "Too many requests." }, 429, req, retryAfter ?? 60);
    }

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }

    console.log("[upload-gallery-photo] Parsing FormData...");
    const formData = await req.formData();
    const file = formData.get("file");
    const projectId = formData.get("project_id") as string;
    const type = formData.get("type") as string;
    const caption = formData.get("caption") as string | null;

    console.log(`[upload-gallery-photo] Uploading ${type} for project ${projectId}`);

    if (!file || !(file instanceof File)) {
      console.error("[upload-gallery-photo] No file in FormData");
      return jsonResponse({ error: "No file provided" }, 400, req);
    }

    if (!projectId || !type) {
      return jsonResponse({ error: "project_id and type are required" }, 400, req);
    }

    const admin = getServiceClient();
    await assertProjectOwner(admin, projectId, userId);

    const fileBuffer = await file.arrayBuffer();
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${projectId}/${userId}/vault_${type}_${Date.now()}.${ext}`;

    // 1. Upload to storage using service role
    const { error: storageErr } = await admin.storage
      .from("project-photos")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (storageErr) throw new Error(`Storage failed: ${storageErr.message}`);

    // 2. Insert into project_gallery table
    const { data: galleryEntry, error: dbErr } = await admin
      .from("project_gallery")
      .insert({
        project_id: projectId,
        photo_type: type, // "before", "after", or "progress"
        storage_path: storagePath,
        uploaded_by_user_id: userId,
        caption: formData.get("caption") as string || null,
      })
      .select()
      .single();

    if (dbErr) throw new Error(`DB insert failed: ${dbErr.message}`);

    return jsonResponse({ storagePath, id: galleryEntry.id }, 200, req);
  } catch (e) {
    console.error("[upload-gallery-photo] Failure:", e.message);
    return jsonResponse({ error: e.message || "An unexpected error occurred" }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
