import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { uploadInvoiceSchema as _uploadInvoiceSchema } from "../_shared/validation.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";
import {
  ARCHITECT_UPLOADS_PER_MONTH as _ARCHITECT_UPLOADS_PER_MONTH,
  checkInvoiceUploadAllowed,
  releaseArchitectInvoiceUploadSlot,
  reserveArchitectInvoiceUploadSlot,
} from "../_shared/entitlements.ts";
import {
  extractInvoiceFromPdf,
  type ProjectScopeItem,
} from "../_shared/ocr.ts";
import { type SupabaseClient as _SupabaseClient } from "@supabase/supabase-js";
import {
  coerceLedgerDocumentType,
  inferDocumentTypeFromFilename,
} from "../../../shared/lib/infer-document-type.ts";

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

export const handler = async (req: Request) => {
  const perfTotal = Date.now();

  // 1. Handle Options/CORS immediately
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, req);
    }

    const { ok, retryAfter } = await checkRateLimit(req);
    if (!ok) {
      return jsonResponse(
        { error: "Too many requests." },
        429,
        req,
        retryAfter ?? 60,
      );
    }

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return jsonResponse(
        { error: "Unauthorized", error_code: "SESSION_REQUIRED" },
        401,
        req,
      );
    }

    // 2. Parse Multi-part Form
    const formData = await req.formData();
    const file = formData.get("file");
    const projectId = formData.get("project_id") as string;
    const docType = (formData.get("document_type") || "invoice") as string;
    const vendorHint = formData.get("vendor_hint") as string;
    const amountHint = formData.get("amount_hint");

    if (!file || !(file instanceof File)) {
      return jsonResponse(
        { error: "No valid file provided in request" },
        400,
        req,
      );
    }

    console.log(
      `[upload-document] Received ${file.name} (${file.size} bytes) for project ${projectId}`,
    );

    const admin = getServiceClient();
    await assertProjectOwner(admin, projectId, userId);

    // 3. Resolve Document Type
    let resolvedType = docType;
    if (resolvedType === "auto") {
      resolvedType = inferDocumentTypeFromFilename(file.name) || "invoice";
    }
    const finalDocType = coerceLedgerDocumentType(resolvedType);

    const entitlement = await checkInvoiceUploadAllowed(
      admin,
      userId,
      projectId,
      finalDocType,
    );
    if (!entitlement.allowed) {
      return jsonResponse(
        { error: entitlement.reason, error_code: entitlement.code },
        403,
        req,
      );
    }

    // 3. Buffer Data (Critical: Do this before any other async handoffs)
    const fileBuffer = await file.arrayBuffer();
    const mime = resolvedMimeType(file);
    const docId = crypto.randomUUID();

    let rollbackArchitectSlot = false;
    try {
      if (docType === "invoice" && entitlement.reason === "architect_plan") {
        const slot = await reserveArchitectInvoiceUploadSlot(admin, userId);
        if (!slot.ok) {
          return jsonResponse(
            {
              error: `Architect plan limit reached.`,
              error_code: "INVOICE_LIMIT_ARCHITECT_MONTH",
            },
            403,
            req,
          );
        }
        rollbackArchitectSlot = true;
      }

      // 4. Storage Upload
      const ext = file.name.includes(".")
        ? file.name.slice(file.name.lastIndexOf("."))
        : "";
      const storagePath = `${projectId}/${userId}/${docType}_${docId}${ext}`;

      const { error: storageErr } = await admin.storage
        .from("project-documents")
        .upload(storagePath, fileBuffer, { contentType: mime, upsert: false });

      if (storageErr) throw new Error(`Storage failed: ${storageErr.message}`);

      // 5. Database Records
      const { data: doc, error: docErr } = await admin.from("documents").insert(
        {
          id: docId,
          project_id: projectId,
          type: finalDocType,
          storage_path: storagePath,
          original_filename: file.name,
          uploaded_by_user_id: userId,
          ocr_status: finalDocType === "invoice" || finalDocType === "receipt"
            ? "pending"
            : "success",
        },
      ).select("id").single();

      if (docErr || !doc) {
        throw new Error(`Document DB record failed: ${docErr?.message}`);
      }

      const invoiceId = crypto.randomUUID();
      const isPayable = finalDocType === "invoice" ||
        finalDocType === "receipt" || finalDocType === "quote";

      let subtotal = amountHint
        ? parseFloat(String(amountHint))
        : (isPayable ? 1850 : 0);
      let tax = isPayable ? Math.round(subtotal * 0.08) : 0;
      let total = subtotal + tax;
      let vendorLabel = vendorHint || (isPayable ? "Vendor" : "Document");
      let lineItems: any[] = [];

      // 6. AI Logic (Only if invoice/receipt)
      if (isPayable) {
        console.log(`[upload-document] Triggering Gemini 3.1 OCR for ${docId}`);
        const { data: scopeRows } = await admin
          .from("scope_items")
          .select("id, category, description")
          .eq("project_id", projectId);

        const ocr = await extractInvoiceFromPdf(
          bufferToBase64(fileBuffer),
          mime,
          (scopeRows || []) as ProjectScopeItem[],
        );

        if (ocr) {
          if (ocr.vendor_name) vendorLabel = ocr.vendor_name;
          if (ocr.total != null) total = ocr.total;
          if (ocr.subtotal != null) subtotal = ocr.subtotal;
          if (ocr.tax_total != null) tax = ocr.tax_total;
          lineItems = (ocr.line_items || []).map((li) => ({
            invoice_id: invoiceId,
            description: li.description,
            quantity: li.quantity,
            unit_price: li.unit_price,
            unit_of_measure: "ea",
            tax_rate: 0,
            tax_amount: 0,
            line_total: li.line_total,
            category: "labor",
            scope_item_id: li.mapped_scope_item_id || null,
          }));
        }
      }

      if (lineItems.length === 0) {
        lineItems = [{
          invoice_id: invoiceId,
          description: vendorHint
            ? `Services from ${vendorHint}`
            : "Invoice line",
          quantity: 1,
          unit_price: subtotal,
          unit_of_measure: "job",
          tax_rate: 0.08,
          tax_amount: tax,
          line_total: total,
          category: "labor",
        }];
      }

      // 7. Finalize DB
      const { error: invErr } = await admin.from("invoices").insert({
        id: invoiceId,
        document_id: doc.id,
        project_id: projectId,
        document_type: finalDocType,
        vendor_name: vendorLabel,
        total,
        subtotal,
        tax_total: tax,
        payment_status: "unpaid",
        currency: "USD",
        issue_date: new Date().toISOString().slice(0, 10),
      });

      if (invErr) {
        throw new Error(`Invoice DB record failed: ${invErr.message}`);
      }

      if (lineItems.length > 0 && isPayable) {
        await admin.from("invoice_line_items").insert(lineItems);
        await admin.from("documents").update({ ocr_status: "success" }).eq(
          "id",
          doc.id,
        );
      }

      console.log(
        `[upload-document] Success! Total time: ${Date.now() - perfTotal}ms`,
      );
      return jsonResponse(
        {
          invoice_id: invoiceId,
          document_id: doc.id,
          document_type: finalDocType,
        },
        202,
        req,
      );
    } catch (e) {
      if (rollbackArchitectSlot) {
        await releaseArchitectInvoiceUploadSlot(admin, userId).catch((err) =>
          console.error(err)
        );
      }
      throw e; // Rethrow to global catch
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("[upload-document] Critical Failure:", error.message);
    return jsonResponse(
      { error: error.message || "An unexpected error occurred during upload" },
      500,
      req,
    );
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
