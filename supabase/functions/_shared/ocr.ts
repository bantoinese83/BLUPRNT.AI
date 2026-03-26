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
  }>;
  subtotal: number | null;
  tax_total: number | null;
  total: number | null;
};

export async function extractInvoiceFromPdf(
  pdfBase64: string,
  mimeType: string,
): Promise<OcrInvoiceResult | null> {
  const systemInstruction = `Extract structured data from the provided invoice/PDF.
If a field cannot be extracted, return null. 
For line_items, ensure each entry has description, quantity, unit_price, and line_total.`;

  const prompt = "Please process this invoice.";

  const responseSchema = {
    type: "object",
    properties: {
      vendor_name: { type: "string", nullable: true },
      invoice_number: { type: "string", nullable: true },
      issue_date: { type: "string", nullable: true, description: "YYYY-MM-DD" },
      line_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            unit_price: { type: "number" },
            line_total: { type: "number" },
          },
          required: ["description", "quantity", "unit_price", "line_total"],
        },
      },
      subtotal: { type: "number", nullable: true },
      tax_total: { type: "number", nullable: true },
      total: { type: "number", nullable: true },
    },
    required: [
      "vendor_name",
      "invoice_number",
      "issue_date",
      "line_items",
      "subtotal",
      "tax_total",
      "total",
    ],
  };

  const parts: GeminiPart[] = [
    { text: prompt },
    {
      inline_data: {
        mime_type: mimeType || "application/pdf",
        data: pdfBase64,
      },
    },
  ];

  try {
    const result = await callGemini({
      parts,
      systemInstruction,
      responseSchema,
      temperature: 0.1,
    });

    if (!result) return null;

    if (result.text.startsWith("ERROR:")) {
      console.error("Gemini API reported error in OCR:", result.text);
      return null;
    }

    let parsed: OcrInvoiceResult;
    if (result.data && typeof result.data === "object") {
      parsed = result.data as OcrInvoiceResult;
    } else {
      parsed = JSON.parse(result.text) as OcrInvoiceResult;
    }
    if (!parsed || typeof parsed !== "object") return null;

    return {
      vendor_name: parsed.vendor_name || null,
      invoice_number: parsed.invoice_number || null,
      issue_date: parsed.issue_date || null,
      line_items: Array.isArray(parsed.line_items) ? parsed.line_items : [],
      subtotal: parsed.subtotal ?? null,
      tax_total: parsed.tax_total ?? null,
      total: parsed.total ?? null,
    };
  } catch (e) {
    console.error("OCR extraction error:", e);
    return null;
  }
}
