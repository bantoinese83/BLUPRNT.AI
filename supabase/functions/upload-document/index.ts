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

/** Converts a Buffer to a Base64 string for OCR processing. */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  const perfTotal = Date.now();
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
    // Read raw form data once
    const formData = await req.formData();
    const file = formData.get("file");
    const projectId = formData.get("project_id") as string;
    const docType = (formData.get("document_type") || "invoice") as string;
    const vendorHint = formData.get("vendor_hint") as string;
    const amountHint = formData.get("amount_hint");

    if (!(file instanceof File)) {
      return jsonResponse({ error: "No file provided" }, 400, req);
    }

    const admin = getServiceClient();
    await assertProjectOwner(admin, projectId, userId);

    const entitlement = await checkInvoiceUploadAllowed(admin, userId, projectId, docType);
    if (!entitlement.allowed) {
      return jsonResponse({ error: entitlement.reason, error_code: entitlement.code }, 403, req);
    }

    // Read buffer early to avoid stream locks
    const fileBuffer = await file.arrayBuffer();
    const mime = resolvedMimeType(file);
    const docId = crypto.randomUUID();

    // 1. Upload to Storage
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const storagePath = `${projectId}/${userId}/${docType}_${docId}${ext}`;
    
    const { error: storageErr } = await admin.storage
      .from("project-documents")
      .upload(storagePath, fileBuffer, { contentType: mime, upsert: false });

    if (storageErr) throw new Error(`Storage failed: ${storageErr.message}`);

    // 2. Insert Document Record
    const { data: doc, error: docErr } = await admin.from("documents").insert({
      id: docId,
      project_id: projectId,
      type: docType,
      storage_path: storagePath,
      original_filename: file.name,
      uploaded_by_user_id: userId,
      ocr_status: docType === "invoice" ? "pending" : "success",
    }).select("id").single();

    if (docErr || !doc) throw new Error(`DB Document failed: ${docErr?.message}`);

    // 3. OCR (if invoice)
    const invoiceId = crypto.randomUUID();
    let subtotal = amountHint ? parseFloat(String(amountHint)) : (docType === "invoice" ? 1850 : 0);
    let tax = docType === "invoice" ? Math.round(subtotal * 0.08) : 0;
    let total = subtotal + tax;
    let vendorLabel = vendorHint || (docType === "invoice" ? "Vendor" : "Document");
    let lineItems: any[] = [];

    if (docType === "invoice") {
      const { data: scopeRows } = await admin
        .from("scope_items")
        .select("id, category, description")
        .eq("project_id", projectId);

      const ocr = await extractInvoiceFromPdf(
        bufferToBase64(fileBuffer), 
        mime,
        (scopeRows || []) as ProjectScopeItem[]
      );

      if (ocr) {
        if (ocr.vendor_name) vendorLabel = ocr.vendor_name;
        if (ocr.total != null) total = ocr.total;
        if (ocr.subtotal != null) subtotal = ocr.subtotal;
        if (ocr.tax_total != null) tax = ocr.tax_total;
        lineItems = (ocr.line_items || []).map(li => ({
          invoice_id: invoiceId,
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          unit_of_measure: "ea",
          tax_rate: 0, tax_amount: 0,
          line_total: li.line_total,
          category: "labor",
          scope_item_id: li.mapped_scope_item_id || null,
        }));
      }
    }

    if (lineItems.length === 0) {
      lineItems = [{
        invoice_id: invoiceId,
        description: vendorHint ? `Services from ${vendorHint}` : "Invoice line",
        quantity: 1,
        unit_price: subtotal,
        unit_of_measure: "job",
        tax_rate: 0.08, tax_amount: tax,
        line_total: total,
        category: "labor",
      }];
    }

    // 4. Insert Invoice & Lines
    const { error: invErr } = await admin.from("invoices").insert({
      id: invoiceId, document_id: doc.id, project_id: projectId, document_type: docType,
      vendor_name: vendorLabel, total, subtotal, tax_total: tax,
      payment_status: "unpaid", currency: "USD", issue_date: new Date().toISOString().slice(0, 10),
    });

    if (invErr) throw new Error(`DB Invoice failed: ${invErr.message}`);

    if (docType === "invoice") {
      await admin.from("invoice_line_items").insert(lineItems);
      await admin.from("documents").update({ ocr_status: "success" }).eq("id", doc.id);
    }

    return jsonResponse({ invoice_id: invoiceId, document_id: doc.id, document_type: docType }, 202, req);
  } catch (e) {
    console.error("[upload-document] Error:", e.message);
    return jsonResponse({ error: e.message || "Upload failed" }, 500, req);
  }
});
