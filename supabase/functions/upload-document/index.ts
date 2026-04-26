import "jsr:@supabase/functions-js@2.100.0/edge-runtime.d.ts";
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
import { type SupabaseClient as _SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  coerceLedgerDocumentType,
  inferDocumentTypeFromFilename,
} from "../../../shared/lib/infer-document-type.ts";
import { getProjectBudgetHealth } from "../_shared/financials.ts";

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
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = handleOptions(req);
  if (corsHeaders) return corsHeaders;

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401, req);

    const rate = await checkRateLimit(req, "default");
    if (!rate.ok) {
      return jsonResponse(
        { error: "Too many uploads. Please wait a moment." },
        429,
        req,
      );
    }

    const formData = await req.formData();
    const projectId = formData.get("project_id") as string;
    const documentType = formData.get("document_type") as string; // 'invoice', 'receipt', 'quote', 'auto'
    const amountHintStr = formData.get("amount_hint") as string | null;
    const file = formData.get("file") as File;

    if (!projectId || !file) {
      return jsonResponse(
        { error: "Missing required fields (project_id, file)" },
        400,
        req,
      );
    }

    const admin = getServiceClient();
    await assertProjectOwner(admin, projectId, userId);

    const mime = resolvedMimeType(file);
    const originalFilename = file.name || "upload";

    // 1. Check Entitlements
    const entitlement = await checkInvoiceUploadAllowed(
      admin,
      userId,
      projectId,
      documentType,
    );
    if (!entitlement.allowed) {
      return jsonResponse(
        {
          error: entitlement.reason || "Upload limit reached.",
          code: entitlement.code || "UPLOAD_LIMIT_REACHED",
        },
        403,
        req,
      );
    }

    // 2. Reserve slot if using Architect quota
    let reservedSlot = false;
    if (entitlement.reason === "architect_plan") {
      const reserved = await reserveArchitectInvoiceUploadSlot(admin, userId);
      if (!reserved.ok) {
        return jsonResponse(
          {
            error: "Monthly upload limit reached.",
            code: "ARCHITECT_LIMIT_REACHED",
          },
          403,
          req,
        );
      }
      reservedSlot = true;
    }

    const extension = originalFilename.split(".").pop() || "bin";
    const storagePath = `${userId}/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;

    try {
      // 2. Upload to Storage
      const { error: storageErr } = await admin.storage
        .from("project-documents")
        .upload(storagePath, file, {
          contentType: mime,
          upsert: false,
        });

      if (storageErr) throw storageErr;

      // 3. OCR Analysis (if applicable)
      let vendorName: string | null = null;
      let total: number | null = null;
      let taxTotal: number | null = null;
      let issueDate: string | null = null;
      let lineItems: any[] = [];
      let ocrConfidence: number | null = null;

      const isOcrSupported =
        mime === "application/pdf" ||
        mime.startsWith("image/jpeg") ||
        mime.startsWith("image/png") ||
        mime.startsWith("image/webp");

      if (isOcrSupported) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = bufferToBase64(arrayBuffer);

        // Fetch scope items to enable intelligent mapping
        const { data: scopeItems } = await admin
          .from("scope_items")
          .select("id, category, description")
          .eq("project_id", projectId);

        const ocrResult = await extractInvoiceFromPdf(
          base64,
          mime,
          scopeItems || [],
        );

        if (ocrResult) {
          vendorName = ocrResult.vendor_name;
          total = ocrResult.total;
          taxTotal = ocrResult.tax_total;
          issueDate = ocrResult.issue_date;
          lineItems = ocrResult.line_items;
          ocrConfidence = 0.9;
        }
      }

      // 4. Create Document Record
      const inferredDocType =
        documentType === "auto"
          ? inferDocumentTypeFromFilename(originalFilename)
          : coerceLedgerDocumentType(documentType);

      const { data: doc, error: docErr } = await admin
        .from("documents")
        .insert({
          project_id: projectId,
          type: inferredDocType,
          storage_path: storagePath,
          original_filename: originalFilename,
          uploaded_by_user_id: userId,
          ocr_status: isOcrSupported ? "success" : "skipped",
        })
        .select()
        .single();

      if (docErr) throw docErr;

      // 5. Create Invoice Record
      const finalTotal = total ?? (amountHintStr ? parseFloat(amountHintStr) : 0);
      const { data: invoice, error: dbErr } = await admin
        .from("invoices")
        .insert({
          project_id: projectId,
          document_id: doc.id,
          document_type: inferredDocType,
          vendor_name: vendorName || "Unknown Vendor",
          total: finalTotal,
          tax_total: taxTotal,
          issue_date: issueDate || new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // 5. Insert Line Items with Intelligent Mapping
      if (lineItems.length > 0) {
        const lineRows = lineItems.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          scope_item_id: item.mapped_scope_item_id || null,
        }));

        const { error: linesErr } = await admin
          .from("invoice_line_items")
          .insert(lineRows);

        if (linesErr) {
          console.warn("[upload-document] Failed to insert line items:", linesErr);
        }
      }

      // 5. Automatic Reconciliation (if line items mapped to scope items)
      // This part depends on the specific project structure, omitted for brevity here
      // but the data is now in the `invoice_line_items` JSONB column.

      const budgetHealth = await getProjectBudgetHealth(admin, projectId);

      return jsonResponse(
        {
          success: true,
          invoice_id: invoice.id,
          document_type: inferredDocType,
          storage_path: storagePath,
          budget_health: budgetHealth,
        },
        200,
        req,
      );
    } catch (e) {
      // Release slot if failure happened after reservation
      if (reservedSlot) {
        await releaseArchitectInvoiceUploadSlot(admin, userId).catch((err) =>
          console.error(err),
        );
      }
      throw e; // Rethrow to global catch
    }
  } catch (e) {
    let message = "An unexpected error occurred during upload";
    if (e instanceof Error) {
      message = e.message;
    } else if (typeof e === "object" && e !== null) {
      message = (e as any).message || (e as any).error || JSON.stringify(e);
    } else {
      message = String(e);
    }

    console.error("[upload-document] Critical Failure:", message);

    if (message === "forbidden") {
      return jsonResponse({ error: "Access denied" }, 403, req);
    }
    return jsonResponse({ error: message }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
