/**
 * Behavioral tests for the upload-document Edge Function logic.
 *
 * Run with: deno test --allow-env supabase/functions/upload-document/index.test.ts
 */
import { assertEquals } from "std/assert";
import { handler } from "./index.ts";
import { setupTestEnv } from "../_shared/test-utils.ts";

Deno.test("upload-document - returns 401 when no session", async () => {
  setupTestEnv();
  const req = new Request("http://localhost/upload-document", {
    method: "POST",
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
});

Deno.test("upload-document - returns 405 for GET", async () => {
  setupTestEnv();
  const req = new Request("http://localhost/upload-document", {
    method: "GET",
  });

  const res = await handler(req);
  assertEquals(res.status, 405);
});

function calculateLedgerEntryTotals(params: {
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

Deno.test("calculateLedgerEntryTotals - uses amount_hint when provided", () => {
  const result = calculateLedgerEntryTotals({ amount_hint: 1000, type: "invoice" });
  assertEquals(result.subtotal, 1000);
  assertEquals(result.total, 1080);
});

Deno.test("calculateLedgerEntryTotals - uses OCR values when detected", () => {
  const result = calculateLedgerEntryTotals({
    ocr_total: 500,
    ocr_subtotal: 450,
    ocr_tax: 50,
    type: "invoice",
  });
  assertEquals(result.subtotal, 450);
  assertEquals(result.total, 500);
});

Deno.test("calculateLedgerEntryTotals - handles non-invoice documents as $0", () => {
  const result = calculateLedgerEntryTotals({ amount_hint: 1000, type: "quote" });
  assertEquals(result.total, 0);
});

Deno.test("calculateLedgerEntryTotals - defaults to $1850 for invoices with no data", () => {
  const result = calculateLedgerEntryTotals({ type: "invoice" });
  assertEquals(result.subtotal, 1850);
  assertEquals(result.total, 1998); // 1850 + 148
});
