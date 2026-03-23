import { useState, useEffect } from "react";
import { X, Loader2, Link2, FileText, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  category: string | null;
  scope_item_id?: string | null;
};

type ScopeSuggestion = {
  scope_item_id: string;
  confidence_score: number;
  reason: string;
};

type InvoiceData = {
  id: string;
  vendor_name: string | null;
  total: number | null;
  subtotal: number | null;
  payment_status: string;
  line_items: LineItem[];
  budget_mapping_suggestions?: ScopeSuggestion[];
};

export function InvoiceReviewModal({
  invoiceId,
  projectId,
  onClose,
  onSaved,
}: {
  invoiceId: string;
  projectId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [scopeItems, setScopeItems] = useState<{ id: string; category: string; description: string }[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: invData, error: invErr } = await supabase.functions.invoke<{
          invoice: InvoiceData;
          line_items: LineItem[];
          budget_mapping_suggestions?: ScopeSuggestion[];
        }>("get-invoice", {
          body: { invoice_id: invoiceId },
        });
        if (cancelled) return;
        if (invErr || !invData) {
          setError("Couldn't load invoice.");
          setLoading(false);
          return;
        }
        const inv = invData as unknown as { invoice: InvoiceData; line_items: LineItem[]; budget_mapping_suggestions?: ScopeSuggestion[] };
        setInvoice({
          ...inv.invoice,
          line_items: inv.line_items ?? [],
          budget_mapping_suggestions: inv.budget_mapping_suggestions,
        });

        const { data: scope } = await supabase
          .from("scope_items")
          .select("id, category, description")
          .eq("project_id", projectId);
        setScopeItems((scope ?? []) as { id: string; category: string; description: string }[]);

        const initial: Record<string, string> = {};
        (inv.line_items ?? []).forEach((line: LineItem) => {
          if (line.scope_item_id) initial[line.id] = line.scope_item_id;
        });
        setMappings(initial);
      } catch {
        if (!cancelled) setError("Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [invoiceId, projectId]);

  async function handleSaveMappings() {
    setSaving(true);
    try {
      for (const [lineId, scopeItemId] of Object.entries(mappings)) {
        await supabase
          .from("invoice_line_items")
          .update({ scope_item_id: scopeItemId || null })
          .eq("id", lineId);
      }
      onSaved?.();
      onClose();
    } catch {
      setError("Couldn't save mappings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-600">Loading invoice…</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            {error ?? "We couldn’t open this document. Close and try again from your list."}
          </p>
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            Review invoice
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <strong className="text-slate-800">Tip:</strong> Match each line to your estimate below so you can see what&apos;s on or off budget.
          </p>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                {invoice.vendor_name ?? "Vendor"}
                {!invoice.vendor_name && (
                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200 bg-amber-50">Low Confidence</Badge>
                )}
              </h4>
              <Badge variant="secondary" className="capitalize">{invoice.payment_status}</Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(invoice.total ?? 0)}
              </p>
              {(!invoice.total || invoice.total === 0) && (
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Verify Total</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Link to budget line (optional)
            </h5>
            <p className="text-xs text-slate-500">
              Link invoice lines to your budget breakdown to track actual vs. estimate.
            </p>
            {invoice.line_items.map((line) => {
              const isUnmapped = !(mappings[line.id] ?? line.scope_item_id);
              const showOverrunHint = isUnmapped && scopeItems.length > 0;
              return (
                <Card key={line.id} className={`p-3 ${showOverrunHint ? "border-amber-200 bg-amber-50/50" : ""}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{line.description}</p>
                      <p className="text-sm text-slate-500">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(line.line_total)}
                      </p>
                      {showOverrunHint && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />
                          Not in your original budget
                        </p>
                      )}
                    </div>
                    <select
                      value={mappings[line.id] ?? line.scope_item_id ?? ""}
                      onChange={(e) => setMappings((m) => ({ ...m, [line.id]: e.target.value }))}
                      className="text-sm rounded-lg border border-slate-300 px-2 py-1 shrink-0">
                      <option value="">— Not mapped</option>
                      {scopeItems.map((s) => (
                        <option key={s.id} value={s.id}>{s.category}</option>
                      ))}
                    </select>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSaveMappings} disabled={saving} className="flex-1 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save mappings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
