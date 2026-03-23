import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { uploadInvoiceSchema } from "../_shared/validation.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";
import {
  checkInvoiceUploadAllowed,
  incrementArchitectUploadCount,
} from "../_shared/entitlements.ts";
import { extractInvoiceFromPdf } from "../_shared/ocr.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = checkRateLimit(req);
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
    return jsonResponse({ error: "Please sign in to upload invoices." }, 401, req);
  }

  try {
    const formData = await req.formData();
    const projectId = String(formData.get("project_id") ?? "").trim();
    const file = formData.get("file");
    const documentType = String(formData.get("document_type") ?? "invoice").trim() || "invoice";
    const vendor_hint = String(formData.get("vendor_hint") ?? "").trim() || null;
    const amount_hint = formData.get("amount_hint");

    const parsed = uploadInvoiceSchema.safeParse({
      project_id: projectId,
      file,
      document_type: documentType,
      vendor_hint: vendor_hint || undefined,
      amount_hint: amount_hint != null && amount_hint !== "" ? amount_hint : undefined,
    });

    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid request";
      return jsonResponse({ error: msg }, 400, req);
    }

    const { project_id, file: validatedFile, document_type: docType, amount_hint: amountNum } = parsed.data;

    const admin = getServiceClient();
    try {
      await assertProjectOwner(admin, project_id, userId);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m === "not_found") return jsonResponse({ error: "Project not found" }, 404, req);
      return jsonResponse({ error: "Access denied" }, 403, req);
    }

    const entitlement = await checkInvoiceUploadAllowed(
      admin,
      userId,
      project_id,
      docType
    );
    if (!entitlement.allowed) {
      return jsonResponse(
        { error: entitlement.reason ?? "Upload limit reached. Upgrade for more." },
        403,
        req
      );
    }

    const docId = crypto.randomUUID();
    const ext = validatedFile.name.includes(".")
      ? validatedFile.name.slice(validatedFile.name.lastIndexOf("."))
      : "";
    const safeName = `${docType}_${docId}${ext}`;
    const storagePath = `${project_id}/${userId}/${safeName}`;

    const fileBuf = await validatedFile.arrayBuffer();
    const buf = new Uint8Array(fileBuf);
    const { error: upErr } = await admin.storage
      .from("project-documents")
      .upload(storagePath, buf, {
        contentType: validatedFile.type || "application/octet-stream",
        upsert: false,
      });

    if (upErr) {
      console.error(upErr);
      return jsonResponse({ error: "Could not store file." }, 500, req);
    }

    const { data: doc, error: docErr } = await admin
      .from("documents")
      .insert({
        id: docId,
        project_id: project_id,
        type: docType,
        storage_path: storagePath,
        original_filename: validatedFile.name,
        uploaded_by_user_id: userId,
        ocr_status: docType === "invoice" ? "pending" : "success",
      })
      .select("id")
      .single();

    if (docErr || !doc) {
      console.error(docErr);
      return jsonResponse({ error: "Could not create document." }, 500, req);
    }

    const createInvoiceRecord = async (type: string) => {
      const invoiceId = crypto.randomUUID();
      let subtotal = amountNum ?? (type === "invoice" ? 1850 : 0);
      let tax = type === "invoice" ? Math.round(subtotal * 0.08) : 0;
      let total = subtotal + tax;
      let vendorLabel =
        type === "invoice"
          ? parsed.data.vendor_hint || "Vendor (review details)"
          : type === "quote"
            ? parsed.data.vendor_hint || "Quote (review details)"
            : type === "warranty"
              ? "Warranty"
              : "Permit";
      let invoiceNumber = `${type.toUpperCase().slice(0, 3)}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      let issueDate = new Date().toISOString().slice(0, 10);
      let lineItemsToInsert: Array<{
        invoice_id: string;
        description: string;
        quantity: number;
        unit_price: number;
        unit_of_measure: string;
        tax_rate: number;
        tax_amount: number;
        line_total: number;
        category: string;
      }> = [];

      if (type === "invoice") {
        const bytes = new Uint8Array(fileBuf);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        const pdfBase64 = btoa(binary);
        const ocrResult = await extractInvoiceFromPdf(
          pdfBase64,
          validatedFile.type || "application/pdf"
        );

        if (ocrResult) {
          if (ocrResult.vendor_name) vendorLabel = ocrResult.vendor_name;
          if (ocrResult.invoice_number) invoiceNumber = ocrResult.invoice_number;
          if (ocrResult.issue_date) issueDate = ocrResult.issue_date;
          if (ocrResult.total != null) total = Math.round(ocrResult.total * 100) / 100;
          if (ocrResult.subtotal != null) subtotal = Math.round(ocrResult.subtotal * 100) / 100;
          if (ocrResult.tax_total != null) tax = Math.round(ocrResult.tax_total * 100) / 100;

          if (ocrResult.line_items.length > 0) {
            lineItemsToInsert = ocrResult.line_items.map((li) => ({
              invoice_id: invoiceId,
              description: li.description,
              quantity: li.quantity,
              unit_price: li.unit_price,
              unit_of_measure: "ea",
              tax_rate: 0,
              tax_amount: 0,
              line_total: li.line_total,
              category: "labor",
            }));
          }
        }

        if (lineItemsToInsert.length === 0) {
          lineItemsToInsert = [
            {
              invoice_id: invoiceId,
              description: parsed.data.vendor_hint
                ? `Services from ${parsed.data.vendor_hint}`
                : "Invoice line (details from upload)",
              quantity: 1,
              unit_price: subtotal,
              unit_of_measure: "job",
              tax_rate: 0.08,
              tax_amount: tax,
              line_total: total,
              category: "labor",
            },
          ];
        }
      }

      const { error: invErr } = await admin.from("invoices").insert({
        id: invoiceId,
        document_id: doc.id,
        project_id: project_id,
        document_type: type,
        vendor_name: vendorLabel,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: null,
        currency: "USD",
        subtotal,
        tax_total: tax,
        total: type === "invoice" ? total : null,
        payment_status: type === "invoice" ? "unpaid" : "n/a",
      });

      if (invErr) {
        console.error(invErr);
        return jsonResponse({ error: "Could not create record." }, 500, req);
      }

      if (type === "invoice") {
        await admin.from("invoice_line_items").insert(lineItemsToInsert);
        await admin.from("documents").update({ ocr_status: "success" }).eq("id", doc.id);
      }

      if (type === "invoice") {
        await incrementArchitectUploadCount(admin, userId);
      }
      return jsonResponse(
        {
          invoice_id: invoiceId,
          document_id: doc.id,
          document_type: docType,
          ocr_status: type === "invoice" ? "success" : "success",
        },
        202,
        req,
      );
    };

    return docType === "invoice"
      ? await createInvoiceRecord("invoice")
      : await createInvoiceRecord(docType);
  } catch (e) {
    console.error(e);
    return jsonResponse(
      { error: "Upload failed. Try again." },
      500,
      req,
    );
  }
});
