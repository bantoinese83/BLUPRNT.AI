import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { uploadInvoiceSchema } from "../_shared/validation.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";
import {
  ARCHITECT_UPLOADS_PER_MONTH,
  checkInvoiceUploadAllowed,
  releaseArchitectInvoiceUploadSlot,
  reserveArchitectInvoiceUploadSlot,
} from "../_shared/entitlements.ts";
import { extractInvoiceFromPdf, type ProjectScopeItem } from "../_shared/ocr.ts";
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Multipart `File.type` is often empty from React Native — infer for storage + OCR. */
function resolvedMimeType(f: File): string {
  const t = (f.type || "").trim().toLowerCase();
  if (t && t !== "application/octet-stream") return t;
  const n = (f.name || "").toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".heic") || n.endsWith(".heif")) return "image/heic";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}

/** Converts an ArrayBuffer to a Base64 string for OCR processing. */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Uploads the raw bytes to the project-documents bucket. */
async function uploadFileToStorage(
  admin: SupabaseClient,
  args: {
    projectId: string;
    userId: string;
    docId: string;
    docType: string;
    file: File;
  },
): Promise<{ path: string; mime: string; error?: string }> {
  const ext = args.file.name.includes(".")
    ? args.file.name.slice(args.file.name.lastIndexOf("."))
    : "";
  const safeName = `${args.docType}_${args.docId}${ext}`;
  const storagePath = `${args.projectId}/${args.userId}/${safeName}`;
  const mime = resolvedMimeType(args.file);

  const { error } = await admin.storage
    .from("project-documents")
    .upload(storagePath, await args.file.arrayBuffer(), {
      contentType: mime,
      upsert: false,
    });

  if (error) return { path: "", mime: "", error: error.message };
  return { path: storagePath, mime };
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = await checkRateLimit(req);
  if (!ok) {
    return jsonResponse({ error: "Too many requests." }, 429, req, retryAfter ?? 60);
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse({ error: "Unauthorized", error_code: "SESSION_REQUIRED" }, 401, req);
  }

  try {
    const formData = await req.formData();
    const parsed = uploadInvoiceSchema.safeParse({
      project_id: formData.get("project_id"),
      file: formData.get("file"),
      document_type: formData.get("document_type") || "invoice",
      vendor_hint: formData.get("vendor_hint"),
      amount_hint: formData.get("amount_hint") || undefined,
    });

    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.errors[0]?.message ?? "Invalid request" }, 400, req);
    }

    const { project_id: projectId, file, document_type: docType, amount_hint: amountNum, vendor_hint } = parsed.data;
    const admin = getServiceClient();

    await assertProjectOwner(admin, projectId, userId);

    const entitlement = await checkInvoiceUploadAllowed(admin, userId, projectId, docType);
    if (!entitlement.allowed) {
      return jsonResponse({ error: entitlement.reason, error_code: entitlement.code }, 403, req);
    }

    let rollbackArchitectSlot = false;
    try {
      if (docType === "invoice" && entitlement.reason === "architect_plan") {
        const slot = await reserveArchitectInvoiceUploadSlot(admin, userId);
        if (!slot.ok) {
          return jsonResponse({
            error: `Architect plan limit reached (${ARCHITECT_UPLOADS_PER_MONTH} uploads).`,
            error_code: "INVOICE_LIMIT_ARCHITECT_MONTH",
          }, 403, req);
        }
        rollbackArchitectSlot = true;
      }

      const docId = crypto.randomUUID();
      const storage = await uploadFileToStorage(admin, { projectId, userId, docId, docType: docType, file });
      if (storage.error) return jsonResponse({ error: "Could not store file." }, 500, req);

      const { data: doc, error: docErr } = await admin.from("documents").insert({
        id: docId,
        project_id: projectId,
        type: docType,
        storage_path: storage.path,
        original_filename: file.name,
        uploaded_by_user_id: userId,
        ocr_status: docType === "invoice" ? "pending" : "success",
      }).select("id").single();

      if (docErr || !doc) return jsonResponse({ error: "Could not create document." }, 500, req);

      // AUTOMATIC TRANSFORMATION SLIDER UPDATES
      if (storage.mime.startsWith("image/")) {
        const { data: project } = await admin
          .from("projects")
          .select("before_photo_storage_path, after_photo_storage_path")
          .eq("id", projectId)
          .single();

        if (project) {
          const updates: Record<string, string> = {};
          
          // 1. If no before photo exists yet, this is it.
          if (!project.before_photo_storage_path) {
            updates.before_photo_storage_path = storage.path;
          }
          
          // 2. ALWAYS update the after photo to the latest upload
          updates.after_photo_storage_path = storage.path;

          await admin.from("projects").update(updates).eq("id", projectId);
        }
      }

      const invoiceId = crypto.randomUUID();
      let subtotal = amountNum ?? (docType === "invoice" ? 1850 : 0);
      let tax = docType === "invoice" ? Math.round(subtotal * 0.08) : 0;
      let total = subtotal + tax;
      let vendorLabel = vendor_hint || (docType === "invoice" ? "Vendor" : docType === "quote" ? "Quote" : docType.charAt(0).toUpperCase() + docType.slice(1));
      let lineItems: any[] = [];

      if (docType === "invoice") {
        // Fetch current project scope for reconciliation mapping
        const { data: scopeRows } = await admin
          .from("scope_items")
          .select("id, category, description")
          .eq("project_id", projectId);

        const projectScope = (scopeRows || []) as ProjectScopeItem[];

        const ocr = await extractInvoiceFromPdf(
          bufferToBase64(await file.arrayBuffer()), 
          storage.mime,
          projectScope
        );

        if (ocr) {
          if (ocr.vendor_name) vendorLabel = ocr.vendor_name;
          if (ocr.total != null) total = Math.round(ocr.total * 100) / 100;
          if (ocr.subtotal != null) subtotal = Math.round(ocr.subtotal * 100) / 100;
          if (ocr.tax_total != null) tax = Math.round(ocr.tax_total * 100) / 100;
          lineItems = (ocr.line_items || []).map(li => ({
            invoice_id: invoiceId,
            description: li.description,
            quantity: li.quantity,
            unit_price: li.unit_price,
            unit_of_measure: "ea",
            tax_rate: 0, tax_amount: 0,
            line_total: li.line_total,
            category: "labor",
            scope_item_id: li.mapped_scope_item_id || null, // Reconciliation Mapping
          }));
        }
      }

      if (lineItems.length === 0) {
        lineItems = [{
          invoice_id: invoiceId,
          description: vendor_hint ? `Services from ${vendor_hint}` : "Invoice line",
          quantity: 1,
          unit_price: subtotal,
          unit_of_measure: "job",
          tax_rate: 0.08, tax_amount: tax,
          line_total: total,
          category: "labor",
        }];
      }

      await admin.from("invoices").insert({
        id: invoiceId, document_id: doc.id, project_id: projectId, document_type: docType,
        vendor_name: vendorLabel, total: Number.isFinite(total) ? total : 0,
        subtotal: Number.isFinite(subtotal) ? subtotal : 0,
        tax_total: Number.isFinite(tax) ? tax : 0,
        payment_status: "unpaid", currency: "USD", issue_date: new Date().toISOString().slice(0, 10),
      });

      if (docType === "invoice") {
        await admin.from("invoice_line_items").insert(lineItems);
        await admin.from("documents").update({ ocr_status: "success" }).eq("id", doc.id);
      }

      rollbackArchitectSlot = false;
      return jsonResponse({ invoice_id: invoiceId, document_id: doc.id, document_type: docType }, 202, req);
    } finally {
      if (rollbackArchitectSlot) {
        await releaseArchitectInvoiceUploadSlot(admin, userId).catch(err => console.error(err));
      }
    }
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: "Upload failed." }, 500, req);
  }
});
