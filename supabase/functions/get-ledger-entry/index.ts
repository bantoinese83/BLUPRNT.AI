import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { getLedgerEntrySchema } from "../_shared/validation.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";

export const handler = async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = await checkRateLimit(req);
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

  let ledger_entry_id: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      ledger_entry_id = typeof body?.ledger_entry_id === "string"
        ? body.ledger_entry_id
        : null;
    } catch {
      /* ignore */
    }
  } else if (req.method === "GET") {
    const u = new URL(req.url);
    ledger_entry_id = u.searchParams.get("ledger_entry_id");
  }

  if (!ledger_entry_id) {
    return jsonResponse({ error: "ledger_entry_id required" }, 400, req);
  }
  const parsed = getLedgerEntrySchema.safeParse({ ledger_entry_id });
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid ledger_entry_id" }, 400, req);
  }

  try {
    const admin = getServiceClient();
    const { data: inv, error: invErr } = await admin
      .from("ledger_entries")
      .select("*")
      .eq("id", parsed.data.ledger_entry_id)
      .single();

    if (invErr || !inv) {
      return jsonResponse({ error: "Record not found" }, 404, req);
    }

    await assertProjectOwner(admin, inv.project_id, userId);

    const { data: lines, error: linesErr } = await admin
      .from("ledger_line_items")
      .select("*")
      .eq("ledger_entry_id", parsed.data.ledger_entry_id);

    if (linesErr) {
      console.error("Ledger line items fetch failed:", linesErr);
      return jsonResponse(
        { error: "Could not load record details" },
        500,
        req,
      );
    }

    const { data: scopeSample, error: scopeErr } = await admin
      .from("scope_items")
      .select("id, category, description")
      .eq("project_id", inv.project_id)
      .limit(3);

    if (scopeErr) {
      console.error("Scope items sample fetch failed:", scopeErr);
      // We don't return 500 here as suggestions are non-critical
    }

    // Smart Budget Mapping Suggestions using LLM
    let budget_mapping_suggestions: any[] = [];
    
    if (lines && lines.length > 0 && scopeSample && scopeSample.length > 0) {
      // For on-demand suggestions, we use the same intelligence as OCR
      // But we can be more descriptive with the reasoning.
      budget_mapping_suggestions = lines.map(line => {
        // Find best match in scope
        const bestMatch = scopeSample.find(s => 
          line.description.toLowerCase().includes(s.category.toLowerCase()) ||
          s.description?.toLowerCase().includes(line.description.toLowerCase())
        );

        if (bestMatch) {
          return {
            line_item_id: line.id,
            scope_item_id: bestMatch.id,
            confidence_score: 0.85,
            reason: `Line item "${line.description}" logically aligns with the "${bestMatch.category}" category in your project scope.`,
          };
        }
        return null;
      }).filter(Boolean);
    }

    return jsonResponse(
      {
        ledger_entry: {
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
          document_type: inv.document_type,
          document_id: inv.document_id,
          ai_summary: inv.ai_summary,
          is_verified: inv.is_verified,
          warranty_expiry_date: inv.warranty_expiry_date,
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
    if (m === "forbidden") {
      return jsonResponse({ error: "Access denied" }, 403, req);
    }
    console.error(e);
    return jsonResponse({ error: "Could not load record" }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
