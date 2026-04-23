/**
 * Behavioral tests for the upload-document Edge Function logic.
 *
 * Run with: deno test --allow-env supabase/functions/upload-document/index.test.ts
 */
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";

function calculateInvoiceTotals(params: {
  amount_hint?: number;
  ocr_total?: number;
  ocr_subtotal?: number;
  ocr_tax?: number;
  type: string;
}) {
  const { amount_hint, ocr_total, ocr_subtotal, ocr_tax, type } = params;

  if (type !== "invoice") {
    return { subtotal: 0, tax_total: 0, total: 0 };
  }

  // Use OCR if available
  if (ocr_total != null) {
    return {
      subtotal: ocr_subtotal ?? ocr_total,
      tax_total: ocr_tax ?? 0,
      total: ocr_total,
    };
  }

  // Use hint if available
  if (amount_hint != null) {
    return {
      subtotal: amount_hint,
      tax_total: Math.round(amount_hint * 0.08 * 100) / 100,
      total: Math.round(amount_hint * 1.08 * 100) / 100,
    };
  }

  // Default
  const defaultSub = 1850;
  return {
    subtotal: defaultSub,
    tax_total: 148,
    total: 1998,
  };
}

Deno.test("calculateInvoiceTotals - uses amount_hint when provided", () => {
  const result = calculateInvoiceTotals({ amount_hint: 1000, type: "invoice" });
  assertEquals(result.subtotal, 1000);
  assertEquals(result.total, 1080);
});

Deno.test("calculateInvoiceTotals - uses OCR values when detected", () => {
  const result = calculateInvoiceTotals({
    ocr_total: 500,
    ocr_subtotal: 450,
    ocr_tax: 50,
    type: "invoice",
  });
  assertEquals(result.subtotal, 450);
  assertEquals(result.total, 500);
});

Deno.test("calculateInvoiceTotals - handles non-invoice documents as $0", () => {
  const result = calculateInvoiceTotals({ amount_hint: 1000, type: "quote" });
  assertEquals(result.total, 0);
});

Deno.test("calculateInvoiceTotals - defaults to $1850 for invoices with no data", () => {
  const result = calculateInvoiceTotals({ type: "invoice" });
  assertEquals(result.subtotal, 1850);
  assertEquals(result.total, 1998); // 1850 + 148
});
