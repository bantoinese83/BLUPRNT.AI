import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { getLedgerEntrySchema } from "../_shared/validation.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";

const SIGNED_URL_TTL_SEC = 3600;

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
    return jsonResponse({ error: "Please sign in." }, 401, req);
  }

  let ledger_entry_id: string | null = null;
  let width: number | undefined;
  let height: number | undefined;
  let resize: "cover" | "contain" | "fill" | undefined;

  try {
    const body = await req.json();
    ledger_entry_id = typeof body?.ledger_entry_id === "string" 
      ? body.ledger_entry_id 
      : null;
    width = typeof body?.width === "number" ? body.width : undefined;
    height = typeof body?.height === "number" ? body.height : undefined;
    resize = ["cover", "contain", "fill"].includes(body?.resize)
      ? body.resize
      : undefined;
  } catch (e) {
    console.warn(
      "[get-document-signed-url] Invalid or empty JSON body:",
      e instanceof Error ? e.message : String(e),
    );
  }

  if (!ledger_entry_id) {
    return jsonResponse({ error: "ledger_entry_id required" }, 400, req);
  }

  const parsed = getLedgerEntrySchema.safeParse({ ledger_entry_id });
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid ledger_entry_id" }, 400, req);
  }

  try {
    const admin = getServiceClient();
    const { data: inv, error: invErr } = await admin
      .from("ledger_entries")
      .select("project_id, document_id")
      .eq("id", parsed.data.ledger_entry_id)
      .single();

    if (invErr || !inv) {
      return jsonResponse({ error: "Record not found" }, 404, req);
    }

    await assertProjectOwner(admin, inv.project_id, userId);

    if (!inv.document_id) {
      return jsonResponse(
        { error: "No original file is linked to this record." },
        404,
        req,
      );
    }

    const { data: doc, error: docErr } = await admin
      .from("documents")
      .select("storage_path, original_filename")
      .eq("id", inv.document_id)
      .single();

    if (docErr || !doc?.storage_path) {
      return jsonResponse({ error: "Original file not found." }, 404, req);
    }

    const { data: signed, error: signErr } = await admin.storage
      .from("project-documents")
      .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SEC, {
        transform: width || height
          ? { width, height, resize: resize || "contain" }
          : undefined,
      });

    if (signErr || !signed?.signedUrl) {
      console.error(signErr);
      return jsonResponse(
        { error: "Could not create a secure link. Try again." },
        500,
        req,
      );
    }

    return jsonResponse(
      {
        signedUrl: signed.signedUrl,
        filename: doc.original_filename ?? "document",
        expires_in: SIGNED_URL_TTL_SEC,
      },
      200,
      req,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "not_found") {
      return jsonResponse({ error: "Record not found" }, 404, req);
    }
    if (msg === "forbidden") {
      return jsonResponse({ error: "Access denied" }, 403, req);
    }
    console.error(e);
    return jsonResponse({ error: "Something went wrong." }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
