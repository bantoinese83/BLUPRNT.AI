import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { extractInvoiceFromPdf } from "../_shared/ocr.ts";

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
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const admin = getServiceClient();

  try {
    const { queue_id } = await req.json();
    if (!queue_id) return jsonResponse({ error: "queue_id required" }, 400, req);

    // 1. Fetch queue item
    const { data: queueItem, error: fetchErr } = await admin
      .from("document_processing_queue")
      .select("*")
      .eq("id", queue_id)
      .single();

    if (fetchErr || !queueItem) {
      console.error("[process-document-queue] Queue item not found:", fetchErr);
      return jsonResponse({ error: "Queue item not found" }, 404, req);
    }

    // 2. Mark as processing
    await admin
      .from("document_processing_queue")
      .update({ status: "processing", attempts: queueItem.attempts + 1, updated_at: new Date().toISOString() })
      .eq("id", queue_id);

    // 3. Check file size before download to prevent OOM
    const { data: metadata, error: metaErr } = await admin.storage
      .from("project-documents")
      .getMetadata(queueItem.file_path);

    if (metaErr) {
      console.warn("[process-document-queue] Metadata check failed:", metaErr.message);
    } else if (metadata && metadata.size > 15 * 1024 * 1024) {
      throw new Error(`File is too large to process (${(metadata.size / 1024 / 1024).toFixed(1)}MB). Please upload a smaller file (max 15MB).`);
    }

    // 4. Download file from storage
    const { data: fileData, error: downloadErr } = await admin.storage
      .from("project-documents")
      .download(queueItem.file_path);

    if (downloadErr || !fileData) {
      throw new Error(`File download failed: ${downloadErr?.message || "No data"}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = bufferToBase64(arrayBuffer);

    // 4. Fetch scope items for mapping
    const { data: scopeItems } = await admin
      .from("scope_items")
      .select("id, category, description")
      .eq("project_id", queueItem.project_id);

    // 5. Run OCR
    const ocrResult = await extractInvoiceFromPdf(
      base64,
      queueItem.mime_type,
      scopeItems || [],
    );

    if (!ocrResult) {
      throw new Error("OCR extraction returned no result");
    }

    // 6. Update Invoice Record
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .update({
        vendor_name: ocrResult.vendor_name || "Unknown Vendor",
        total: ocrResult.total || 0,
        tax_total: ocrResult.tax_total,
        issue_date: ocrResult.issue_date || new Date().toISOString().split("T")[0],
      })
      .eq("document_id", queueItem.document_id)
      .select()
      .single();

    if (invErr) throw invErr;

    // 7. Insert Line Items
    if (ocrResult.line_items && ocrResult.line_items.length > 0) {
      const lineRows = ocrResult.line_items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        scope_item_id: item.mapped_scope_item_id || null,
        owner_user_id: queueItem.owner_user_id,
      }));

      const { error: linesErr } = await admin
        .from("invoice_line_items")
        .insert(lineRows);

      if (linesErr) {
        console.warn("[process-document-queue] Failed to insert line items:", linesErr);
      }
    }

    // 8. Update Document OCR Status
    await admin
      .from("documents")
      .update({ ocr_status: "success" })
      .eq("id", queueItem.document_id);

    // 9. Generate and Store Semantic Embedding for Retrieval
    try {
      const summaryText = `Invoice from ${ocrResult.vendor_name || "Unknown Vendor"} on ${ocrResult.issue_date || "Unknown Date"} for total ${ocrResult.total || 0}. Items: ${ocrResult.line_items?.map((l: any) => l.description).join(", ")}`;
      const embedding = await generateEmbedding(summaryText);

      if (embedding) {
        await admin.from("document_embeddings").insert({
          document_id: queueItem.document_id,
          project_id: queueItem.project_id,
          content: summaryText,
          embedding: embedding,
        });
      }
    } catch (embErr) {
      console.warn("[process-document-queue] Embedding generation failed:", embErr);
    }

    // 10. Mark queue as completed
    await admin
      .from("document_processing_queue")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", queue_id);

    return jsonResponse({ success: true }, 200, req);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[process-document-queue] Critical Failure:", message);

    // Update queue with error
    const { queue_id } = await req.json().catch(() => ({}));
    if (queue_id) {
      await admin
        .from("document_processing_queue")
        .update({ status: "failed", error_message: message, updated_at: new Date().toISOString() })
        .eq("id", queue_id);
    }

    return jsonResponse({ error: message }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
