/**
 * Invoice OCR using Google Gemini Vision.
 * Set GEMINI_API_KEY in Edge Function secrets to enable.
 * Falls back to placeholder data when not configured.
 */

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
  mimeType: string
): Promise<OcrInvoiceResult | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey?.trim()) return null;

  const prompt = `Extract structured data from this invoice/PDF. Return ONLY valid JSON, no markdown or explanation.
Use this exact structure:
{
  "vendor_name": "string or null",
  "invoice_number": "string or null",
  "issue_date": "YYYY-MM-DD or null",
  "line_items": [{"description": "string", "quantity": number, "unit_price": number, "line_total": number}],
  "subtotal": number or null,
  "tax_total": number or null,
  "total": number or null
}
If you cannot extract a field, use null. For line_items, extract each line item with description, quantity, unit_price, line_total.`;

  try {
    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType || "application/pdf",
                data: pdfBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini OCR error:", res.status, err);
      return null;
    }

    const json = await res.json();
    const cand = json.candidates && json.candidates[0];
    const parts = cand && cand.content && cand.content.parts;
    const firstPart = parts && parts[0];
    const text = firstPart && firstPart.text ? String(firstPart.text).trim() : null;
    if (!text) return null;

    const parsed = JSON.parse(text) as OcrInvoiceResult;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      vendor_name: typeof parsed.vendor_name === "string" ? parsed.vendor_name : null,
      invoice_number: typeof parsed.invoice_number === "string" ? parsed.invoice_number : null,
      issue_date: typeof parsed.issue_date === "string" ? parsed.issue_date : null,
      line_items: Array.isArray(parsed.line_items)
        ? parsed.line_items.filter(
            (li) =>
              li &&
              typeof li.description === "string" &&
              typeof li.quantity === "number" &&
              typeof li.unit_price === "number" &&
              typeof li.line_total === "number"
          )
        : [],
      subtotal: typeof parsed.subtotal === "number" ? parsed.subtotal : null,
      tax_total: typeof parsed.tax_total === "number" ? parsed.tax_total : null,
      total: typeof parsed.total === "number" ? parsed.total : null,
    };
  } catch (e) {
    console.error("OCR extraction error:", e);
    return null;
  }
}
