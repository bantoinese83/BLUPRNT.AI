import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { getInvoiceSchema } from "../_shared/validation.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  if (req.method !== "POST" && req.method !== "GET") {
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
    return jsonResponse({ error: "Please sign in." }, 401, req);
  }

  let invoice_id: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      invoice_id = typeof body?.invoice_id === "string" ? body.invoice_id : null;
    } catch {
      /* ignore */
    }
  } else if (req.method === "GET") {
    const u = new URL(req.url);
    invoice_id = u.searchParams.get("invoice_id");
  }

  if (!invoice_id) {
    return jsonResponse({ error: "invoice_id required" }, 400, req);
  }
  const parsed = getInvoiceSchema.safeParse({ invoice_id });
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid invoice_id" }, 400, req);
  }

  try {
    const admin = getServiceClient();
    const { data: inv, error: invErr } = await admin
      .from("invoices")
      .select("*")
      .eq("id", parsed.data.invoice_id)
      .single();

    if (invErr || !inv) {
      return jsonResponse({ error: "Invoice not found" }, 404, req);
    }

    await assertProjectOwner(admin, inv.project_id, userId);

    const { data: lines } = await admin
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", parsed.data.invoice_id);

    const { data: scopeSample } = await admin
      .from("scope_items")
      .select("id, category, description")
      .eq("project_id", inv.project_id)
      .limit(3);

    const budget_mapping_suggestions = (scopeSample ?? [])
      .filter((s) =>
        inv.vendor_name &&
        String(s.description).toLowerCase().includes("plumb")
      )
      .map((s) => ({
        scope_item_id: s.id,
        confidence_score: 0.86,
        reason:
          "Description may align with plumbing scope on this project.",
      }));

    return jsonResponse(
      {
        invoice: {
          id: inv.id,
          project_id: inv.project_id,
          vendor_name: inv.vendor_name,
          invoice_number: inv.invoice_number,
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          currency: inv.currency,
          subtotal: inv.subtotal,
          tax_total: inv.tax_total,
          total: inv.total,
          payment_status: inv.payment_status,
          created_at: inv.created_at,
          updated_at: inv.updated_at,
        },
        line_items: (lines ?? []).map((l) => ({
          id: l.id,
          description: l.description,
          product_code: l.product_code,
          quantity: l.quantity,
          unit_price: l.unit_price,
          unit_of_measure: l.unit_of_measure,
          tax_rate: l.tax_rate,
          tax_amount: l.tax_amount,
          discount_rate: l.discount_rate,
          discount_amount: l.discount_amount,
          line_total: l.line_total,
          category: l.category,
          scope_item_id: l.scope_item_id,
        })),
        budget_mapping_suggestions,
      },
      200,
      req,
    );
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "forbidden") return jsonResponse({ error: "Access denied" }, 403, req);
    console.error(e);
    return jsonResponse({ error: "Could not load invoice" }, 500, req);
  }
});
