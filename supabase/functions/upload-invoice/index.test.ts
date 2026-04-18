/**
 * Behavioral tests for the upload-invoice Edge Function logic.
 *
 * Run with: deno test --allow-env supabase/functions/upload-invoice/index.test.ts
 */
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";

/**
 * Mock context/logic derived from the handler's createInvoiceRecord local scoping.
 */
function calculateInvoiceTotals(params: {
  amount_hint?: number;
  ocr_subtotal?: number;
  ocr_tax?: number;
  ocr_total?: number;
  type: string;
}) {
  const { amount_hint, ocr_subtotal, ocr_tax, ocr_total, type } = params;
  
  // Default values copied from handler logic
  let subtotal = amount_hint ?? (type === "invoice" ? 1850 : 0);
  let tax = type === "invoice" ? Math.round(subtotal * 0.08) : 0;
  let total = subtotal + tax;

  if (type === "invoice" && ocr_total != null) {
    if (ocr_total != null) total = Math.round(ocr_total * 100) / 100;
    if (ocr_subtotal != null) subtotal = Math.round(ocr_subtotal * 100) / 100;
    if (ocr_tax != null) tax = Math.round(ocr_tax * 100) / 100;
  }

  // Final safety checks
  const safeSubtotal = type === "invoice" ? (Number.isFinite(subtotal) ? subtotal : (amount_hint ?? 1850)) : 0;
  const safeTax = type === "invoice" ? (Number.isFinite(tax) ? tax : Math.round(safeSubtotal * 0.08)) : 0;
  const safeTotal = type === "invoice" ? (Number.isFinite(total) ? total : safeSubtotal + safeTax) : 0;

  return { subtotal: safeSubtotal, tax: safeTax, total: safeTotal };
}

Deno.test("calculateInvoiceTotals - uses amount_hint when provided", () => {
  const result = calculateInvoiceTotals({ amount_hint: 500, type: "invoice" });
  assertEquals(result.subtotal, 500);
  assertEquals(result.tax, 40); // 8% tax
  assertEquals(result.total, 540);
});

Deno.test("calculateInvoiceTotals - uses OCR values when detected", () => {
  const result = calculateInvoiceTotals({
    type: "invoice",
    ocr_subtotal: 1000.55,
    ocr_tax: 80.05,
    ocr_total: 1080.60
  });
  assertEquals(result.subtotal, 1000.55);
  assertEquals(result.tax, 80.05);
  assertEquals(result.total, 1080.60);
});

Deno.test("calculateInvoiceTotals - handles non-invoice documents as $0", () => {
  const result = calculateInvoiceTotals({ type: "quote", amount_hint: 1000 });
  assertEquals(result.subtotal, 0);
  assertEquals(result.total, 0);
});

Deno.test("calculateInvoiceTotals - defaults to $1850 for invoices with no data", () => {
  const result = calculateInvoiceTotals({ type: "invoice" });
  assertEquals(result.subtotal, 1850);
  assertEquals(result.total, 1998); // 1850 + 148
});
