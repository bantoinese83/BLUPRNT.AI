import { callGemini, type GeminiPart } from "./gemini.ts";

export type OcrInvoiceResult = {
  vendor_name: string | null;
  invoice_number: string | null;
  issue_date: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    mapped_scope_item_id?: string | null;
  }>;
  subtotal: number | null;
  tax_total: number | null;
  total: number | null;
  document_type?: string | null;
  warranty_expiry_date?: string | null;
  summary?: string | null;
};

export type ProjectScopeItem = {
  id: string;
  category: string;
  description: string | null;
};

function asStringOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function asNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeLineItems(raw: unknown): OcrInvoiceResult["line_items"] {
  if (!Array.isArray(raw)) return [];
  const out: OcrInvoiceResult["line_items"] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const description = asStringOrNull(row.description) ?? "Line item";
    const quantity = asNumberOrNull(row.quantity) ?? 1;
    const unitPrice = asNumberOrNull(row.unit_price) ?? 0;
    let lineTotal = asNumberOrNull(row.line_total);
    if (lineTotal == null) {
      lineTotal = unitPrice * quantity;
    }
    out.push({
      description,
      quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      mapped_scope_item_id: asStringOrNull(row.mapped_scope_item_id),
    });
  }
  return out;
}

/**
 * Extracts structured data from an invoice PDF/image.
 * If projectScope is provided, it attempts to map each line item to a scope item.
 */
export async function extractInvoiceFromPdf(
  pdfBase64: string,
  mimeType: string,
  projectScope?: ProjectScopeItem[],
): Promise<OcrInvoiceResult | null> {
  const ledgerTypes = [
    "invoice", "quote", "receipt", "permit", "hoa", "warranty", "maintenance", 
    "manual", "insurance", "disclosure", "inspection", "appraisal", "energy", 
    "contract", "lien_waiver", "other"
  ];

  let systemInstruction =
    `Extract structured data from the provided document with elite optical character recognition and forensic accounting precision.
Vendor name is the company that issued the document. LOOK CAREFULLY for logos, company headers, fine print, or footers to identify the exact vendor entity. 

Identify the 'document_type' as one of these specific keys:
${ledgerTypes.map(t => `- ${t}`).join('\n')}

Guidelines for classification:
- 'invoice': A request for payment for goods or services already provided or to be provided.
- 'receipt': Proof of payment for a completed transaction.
- 'quote': A price estimate or proposal for potential work (not a bill).
- 'insurance': Certificates of Insurance (COI), policy documents, or risk reports.
- 'permit': Building permits, occupancy certificates, or city approvals.
- 'hoa': Correspondence or approvals from a Homeowners Association.
- 'contract': Signed agreements or work orders.
- 'lien_waiver': Documents where a contractor waives their right to place a lien.
- 'warranty': Product warranties or care instructions.
- 'inspection'/'appraisal': Reports on property condition or value.
- 'maintenance': Service logs, HVAC tune-ups, or recurring care records.
- 'manual': User manuals for appliances or home systems.
- 'other': Only if it fits none of the above.

Extraction Rules & Forensic Intelligence:
1. For 'total', look for the final amount often labeled as TOTAL, AMOUNT DUE, GRAND TOTAL, or BALANCE. This is typically the largest currency value at the bottom or top-right of the document.
2. Ensure 'total' includes all taxes, shipping, handling fees, and discounts. Extract subtotal and tax_total separately when clearly itemized.
3. If it's a quote or estimate, 'total' is the projected amount.
4. For line_items, extract with high SKU-level fidelity. Capture exact brand names, dimensions, model numbers, description, quantity, unit_price, and line_total. Handle multi-page invoices and handwritten contractor scrawls gracefully.
5. If a field cannot be extracted with high confidence, return null for that field. 
6. If the document mentions a warranty duration (e.g., '10 year warranty', 'lifetime limited') or an expiration date, calculate the exact expiration date in 'YYYY-MM-DD' format.
7. Provide an insightful, professional 'summary' of the document's contents. Specify key structural items purchased or trades involved (e.g., 'A receipt for premium roofing materials including architectural shingles and underlayment from Home Depot' or 'Detailed municipal building permit for second-floor bathroom addition including plumbing and electrical inspections').
8. If you cannot extract granular line items from the document but a total exists, you MUST still create at least ONE comprehensive entry in 'line_items' that represents the whole document, using the 'summary' as its description and the document 'total' as its 'line_total'.`;

  if (projectScope && projectScope.length > 0) {
    const scopeStr = projectScope.map((s) =>
      `ID: ${s.id}, Category: ${s.category}, Description: ${
        s.description || "N/A"
      }`
    ).join("\n");
    systemInstruction +=
      `\n\nYou are also given the project's planned scope items below:
${scopeStr}

For EACH line_item you extract (including the fallback one representing the total), find the most relevant planned scope item from the list above. 
Return the "ID" of the matching scope item in the "mapped_scope_item_id" field. 
If no reasonable match exists, return null for that field. 
Be accurate: only map if the line item directly contributes to that scope category or description.`;
  }

  /**
   * Gemini `responseSchema` must use lowercase OpenAPI-style types (`object`,
   * `string`, `number`). Uppercase (`OBJECT`, `STRING`) causes the API to
   * reject or ignore the schema, which led to empty `data` and permanent
   * "Extraction Failed" in the document review flow.
   */
  const responseSchema = {
    type: "object",
    properties: {
      vendor_name: { type: "string", nullable: true },
      invoice_number: { type: "string", nullable: true },
      issue_date: {
        type: "string",
        nullable: true,
        description: "YYYY-MM-DD",
      },
      line_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            unit_price: { type: "number" },
            line_total: { type: "number" },
            mapped_scope_item_id: { type: "string", nullable: true },
          },
          required: ["description", "quantity", "unit_price", "line_total"],
        },
      },
      subtotal: { type: "number", nullable: true },
      tax_total: { type: "number", nullable: true },
      total: { type: "number", nullable: true },
      document_type: {
        type: "string",
        enum: [
          "invoice",
          "quote",
          "receipt",
          "permit",
          "hoa",
          "warranty",
          "maintenance",
          "manual",
          "insurance",
          "disclosure",
          "inspection",
          "appraisal",
          "energy",
          "contract",
          "lien_waiver",
          "other",
        ],
        description: "The primary type of document",
      },
      warranty_expiry_date: {
        type: "string",
        nullable: true,
        description: "YYYY-MM-DD",
      },
      summary: {
        type: "string",
        description:
          "Brief but descriptive summary including key items purchased",
      },
    },
    required: ["document_type", "total", "summary", "line_items"],
  };

  const parts: GeminiPart[] = [
    {
      inline_data: {
        mime_type: mimeType || "application/pdf",
        data: pdfBase64,
      },
    },
    {
      text: "Please process this invoice and return ONLY a valid JSON object.",
    },
  ];

  try {
    const result = await callGemini({
      parts,
      systemInstruction,
      responseSchema,
      responseMimeType: "application/json",
      temperature: 0.1,
      timeoutMs: 120_000,
    });

    let parsed: Record<string, unknown> | null =
      result?.data && typeof result.data === "object"
        ? (result.data as Record<string, unknown>)
        : null;

    if (!parsed && result?.text) {
      try {
        let t = result.text.trim();
        if (t.startsWith("```")) {
          t = t.replace(/^```+(json)?\s*/i, "").replace(/\s*```+$/i, "");
        }
        parsed = JSON.parse(t) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
    }

    if (!parsed) {
      console.warn("[ocr] Gemini returned no structured data");
      return null;
    }
    const lineItemCount = Array.isArray(parsed.line_items)
      ? parsed.line_items.length
      : 0;
    if (Deno.env.get("OCR_LOG_FULL_JSON") === "1") {
      console.log("[ocr] Extracted data:", JSON.stringify(parsed));
    } else {
      console.log(
        `[ocr] Extraction ok (keys: ${Object.keys(parsed).join(", ")}; line_items: ${lineItemCount})`,
      );
    }

    return {
      vendor_name: asStringOrNull(parsed.vendor_name),
      invoice_number: asStringOrNull(parsed.invoice_number),
      issue_date: asStringOrNull(parsed.issue_date),
      line_items: normalizeLineItems(parsed.line_items),
      subtotal: asNumberOrNull(parsed.subtotal),
      tax_total: asNumberOrNull(parsed.tax_total),
      total: asNumberOrNull(parsed.total),
      document_type: asStringOrNull(parsed.document_type),
      warranty_expiry_date: asStringOrNull(parsed.warranty_expiry_date),
      summary: asStringOrNull(parsed.summary) ?? undefined,
    };
  } catch (e) {
    console.error("OCR extraction error:", e);
    return null;
  }
}
