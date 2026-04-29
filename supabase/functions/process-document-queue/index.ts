import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { encodeBase64 } from "std/encoding/base64";
import { extractInvoiceFromPdf } from "../_shared/ocr.ts";
import { generateEmbedding } from "../_shared/gemini.ts";
import {
  MAX_DOCUMENT_UPLOAD_SIZE_BYTES,
  MAX_DOCUMENT_UPLOAD_SIZE_LABEL,
} from "../_shared/upload-limits.ts";

const handler = async (req: Request): Promise<Response> => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const admin = getServiceClient();
  let queue_id: string | null = null;
  let queueItem: any = null;

  try {
    const raw_queue_id = await req.json().then(j => j.queue_id).catch(() => null);
    if (!raw_queue_id) return jsonResponse({ error: "queue_id required" }, 400, req);
    
    queue_id = String(raw_queue_id).trim();
    
    const url = Deno.env.get("SUPABASE_URL");
    console.log(`[process-document-queue] Fetching ID: "${queue_id}" on ${url}`);

    const { data: items, error: fetchErr } = await admin
      .from("document_processing_queue")
      .select("*")
      .eq("id", queue_id);

    queueItem = items?.[0];

    if (fetchErr || !queueItem) {
      const msg = `Queue item "${queue_id}" not found.`;
      console.error(`[process-document-queue] ${msg} Error:`, fetchErr);
      return jsonResponse({ error: msg }, 404, req);
    }

    // 2. Mark as processing
    console.log(`[process-document-queue] Marking item ${queue_id} as processing...`);
    await admin
      .from("document_processing_queue")
      .update({ 
        status: "processing", 
        attempts: (queueItem.attempts || 0) + 1, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", queue_id);

    console.log(`[process-document-queue] Processing document: ${queueItem.document_id} (${queueItem.file_path})`);

    // 3. Download file from storage
    const { data: fileData, error: downloadErr } = await admin.storage
      .from("project-documents")
      .download(queueItem.file_path);

    if (downloadErr || !fileData) {
      throw new Error(`File download failed: ${downloadErr?.message || "No data"}`);
    }

    if (fileData.size > MAX_DOCUMENT_UPLOAD_SIZE_BYTES) {
      throw new Error(`File is too large to process (${(fileData.size / 1024 / 1024).toFixed(1)}MB). Limit: ${MAX_DOCUMENT_UPLOAD_SIZE_LABEL}`);
    }

    console.log(`[process-document-queue] Downloaded file size: ${fileData.size} bytes`);
    
    if (fileData.size === 0) {
      throw new Error("Downloaded file is empty (0 bytes)");
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = encodeBase64(arrayBuffer);
    
    console.log(`[process-document-queue] Encoded base64 length: ${base64.length}`);

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

    // Infer payment status
    let payment_status = "unknown";
    if (ocrResult.document_type === "receipt") payment_status = "paid";
    if (ocrResult.document_type === "invoice") payment_status = "unpaid";

    // 6. Update Ledger Entry Record (by primary key — avoids .single() errors
    // if duplicate rows ever exist for the same document_id).
    const { data: ledgerRows, error: ledgerLookupErr } = await admin
      .from("ledger_entries")
      .select("id")
      .eq("document_id", queueItem.document_id)
      .order("created_at", { ascending: true })
      .limit(2);

    if (ledgerLookupErr) throw ledgerLookupErr;
    const ledgerRow = ledgerRows?.[0];
    if (!ledgerRow?.id) {
      throw new Error("No ledger entry found for document");
    }
    if ((ledgerRows?.length ?? 0) > 1) {
      console.warn(
        "[process-document-queue] Multiple ledger rows for document_id; updating oldest",
        queueItem.document_id,
      );
    }

    const { data: ledgerEntry, error: invErr } = await admin
      .from("ledger_entries")
      .update({
        vendor_name: ocrResult.vendor_name || "Unknown Vendor",
        total: ocrResult.total || 0,
        tax_total: ocrResult.tax_total,
        issue_date: ocrResult.issue_date || new Date().toISOString().split("T")[0],
        document_type: ocrResult.document_type || undefined,
        payment_status: payment_status,
        warranty_expiry_date: ocrResult.warranty_expiry_date || null,
        ai_summary: ocrResult.summary || null,
      })
      .eq("id", ledgerRow.id)
      .select()
      .single();

    if (invErr) throw invErr;

    // 6b. Update Document Type if AI confirmed it
    if (ocrResult.document_type) {
      await admin
        .from("documents")
        .update({ type: ocrResult.document_type })
        .eq("id", queueItem.document_id);
    }

    // 7. Insert Line Items (Idempotent: delete existing first if this is a retry)
    let lineItemsToInsert = ocrResult.line_items || [];

    // Fallback: If no line items but we have a total, create a single representative line item
    if (lineItemsToInsert.length === 0 && (ocrResult.total || 0) > 0) {
      console.log("[process-document-queue] No line items found, creating fallback line item from total.");
      lineItemsToInsert = [{
        description: ocrResult.summary || `Total from ${ocrResult.vendor_name || "Document"}`,
        quantity: 1,
        unit_price: ocrResult.total ?? 0,
        line_total: ocrResult.total ?? 0,
        mapped_scope_item_id: null
      }];
    }

    if (lineItemsToInsert.length > 0) {
      console.log(`[process-document-queue] Cleaning up existing line items for entry ${ledgerEntry.id}...`);
      await admin
        .from("ledger_line_items")
        .delete()
        .eq("ledger_entry_id", ledgerEntry.id);

      const lineRows = lineItemsToInsert.map((item: any) => ({
        ledger_entry_id: ledgerEntry.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        scope_item_id: item.mapped_scope_item_id || null,
        owner_user_id: queueItem.owner_user_id,
      }));

      const { error: linesErr } = await admin
        .from("ledger_line_items")
        .insert(lineRows);

      if (linesErr) {
        console.warn("[process-document-queue] Failed to insert line items:", linesErr);
      }
    }

    // 8. Update Document OCR Status (Do this before slow tasks like embeddings)
    await admin
      .from("documents")
      .update({ ocr_status: "success" })
      .eq("id", queueItem.document_id);

    // 9. Generate and Store Semantic Embedding for Retrieval
    console.log("[process-document-queue] Generating embedding...");
    try {
      const itemSummaries = lineItemsToInsert.map((l: any) => l.description).join(", ");
      const summaryText = `Invoice from ${ocrResult.vendor_name || "Unknown Vendor"} on ${ocrResult.issue_date || "Unknown Date"} for total ${ocrResult.total || 0}. Items: ${itemSummaries}`;
      const embedding = await generateEmbedding(summaryText);

      if (embedding) {
        console.log("[process-document-queue] Storing embedding...");
        await admin.from("document_embeddings").delete().eq("document_id", queueItem.document_id);
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
  } catch (e: unknown) {
    const errorString = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
    console.error("[process-document-queue] Fatal:", errorString);

    try {
      if (queue_id) {
        await admin
          .from("document_processing_queue")
          .update({
            status: "failed",
            error_message: errorString,
            updated_at: new Date().toISOString(),
          })
          .eq("id", queue_id);

        // Also update the ledger entry to clear the "Processing..." state
        await admin
          .from("ledger_entries")
          .update({
            vendor_name: "Extraction Failed",
            is_verified: false,
            updated_at: new Date().toISOString(),
          })
          .eq("document_id", queueItem?.document_id);
      }
    } catch (dbErr) {
      console.error("[process-document-queue] Failed to update error status in DB:", dbErr);
    }

    return jsonResponse({ error: errorString }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
