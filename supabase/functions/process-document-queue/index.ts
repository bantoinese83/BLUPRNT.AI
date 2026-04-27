import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { encodeBase64 } from "std/encoding/base64";
import { extractInvoiceFromPdf } from "../_shared/ocr.ts";
import { generateEmbedding } from "../_shared/gemini.ts";

const handler = async (req: Request): Promise<Response> => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const admin = getServiceClient();
  let queue_id: string | null = null;

  try {
    const raw_queue_id = await req.json().then(j => j.queue_id).catch(() => null);
    if (!raw_queue_id) return jsonResponse({ error: "queue_id required" }, 400, req);
    
    queue_id = String(raw_queue_id).trim();
    
    const url = Deno.env.get("SUPABASE_URL");
    console.log(`[process-document-queue] Fetching ID: "${queue_id}" on ${url}`);

    const { data: allItems } = await admin.from("document_processing_queue").select("id");
    const allIds = allItems?.map(i => i.id).join(", ") || "none";

    const { data: items, error: fetchErr } = await admin
      .from("document_processing_queue")
      .select("*")
      .eq("id", queue_id);

    const queueItem = items?.[0];

    if (fetchErr || !queueItem) {
      const msg = `Queue item "${queue_id}" not found. DB Error: ${JSON.stringify(fetchErr)}. Found count: ${items?.length || 0}. Visible IDs: [${allIds}]`;
      console.error("[process-document-queue] " + msg);
      return jsonResponse({ error: msg }, 404, req);
    }

    // 2. Mark as processing
    await admin
      .from("document_processing_queue")
      .update({ status: "processing", attempts: queueItem.attempts + 1, updated_at: new Date().toISOString() })
      .eq("id", queue_id);

    // 3. Download file from storage
    const { data: fileData, error: downloadErr } = await admin.storage
      .from("project-documents")
      .download(queueItem.file_path);

    if (downloadErr || !fileData) {
      throw new Error(`File download failed: ${downloadErr?.message || "No data"}`);
    }

    if (fileData.size > 15 * 1024 * 1024) {
      throw new Error(`File is too large to process (${(fileData.size / 1024 / 1024).toFixed(1)}MB).`);
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
    if (ocrResult.document_type === "invoice") payment_status = "pending";

    // 6. Update Ledger Entry Record
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
      .eq("document_id", queueItem.document_id)
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

    // 7. Insert Line Items
    if (ocrResult.line_items && ocrResult.line_items.length > 0) {
      const lineRows = ocrResult.line_items.map((item: any) => ({
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
      }
    } catch (dbErr) {
      console.error("[process-document-queue] Failed to update error status in DB:", dbErr);
    }

    return jsonResponse({ error: "[VERSION-DEBUG-999] " + errorString }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
