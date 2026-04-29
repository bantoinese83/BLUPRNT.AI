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
    `Extract structured data from the provided document.
Vendor name is the company that issued the document. LOOK CAREFULLY for logos, company headers, or footers to identify the company name. 

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

Extraction Rules:
1. For 'total', look for the final amount often labeled as TOTAL, AMOUNT DUE, or GRAND TOTAL. This is typically the largest currency value at the bottom of the document.
2. Ensure 'total' includes all taxes, fees, and discounts.
3. If it's a quote, 'total' is the estimated amount.
4. For line_items, ensure each entry has description, quantity, unit_price, and line_total.
5. If a field cannot be extracted with high confidence, return null for that field. 
6. If the document mentions a warranty duration (e.g., '10 year warranty') or an expiration date, calculate the expiration date in 'YYYY-MM-DD' format.
7. Provide a brief but descriptive 'summary' of the document's contents. Mention key items purchased or services rendered (e.g. 'A receipt for premium roofing materials including shingles and underlayment from Home Depot' or 'Detailed building permit for second floor renovation including plumbing and electrical').
8. If you cannot extract granular line items from the document but a total exists, you MUST still create at least ONE entry in 'line_items' that represents the whole document, using the 'summary' as its description and the document 'total' as its 'line_total'.`;

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
    console.log("[ocr] Extracted data:", JSON.stringify(parsed));

    return {
      vendor_name: parsed.vendor_name || null,
      invoice_number: parsed.invoice_number || null,
      issue_date: parsed.issue_date || null,
      line_items: Array.isArray(parsed.line_items) ? parsed.line_items : [],
      subtotal: parsed.subtotal ?? null,
      tax_total: parsed.tax_total ?? null,
      total: parsed.total ?? null,
      document_type: parsed.document_type || null,
      warranty_expiry_date: parsed.warranty_expiry_date || null,
      summary: parsed.summary || null,
    };
  } catch (e) {
    console.error("OCR extraction error:", e);
    return null;
  }
}
