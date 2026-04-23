import { useState, useEffect } from "react";
import { X, Loader2, Link2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import {
  coerceLedgerDocumentType,
  type LedgerDocumentType,
} from "@shared/lib/infer-document-type";
import {
  isCapitalLedgerDocumentType,
  ledgerDocumentTypeLabel,
  ledgerDocumentVisualGroup,
  reviewDocumentModalTitle,
} from "@shared/lib/ledger-document-labels";
import { ledgerDocumentSelectOptions } from "@shared/lib/ledger-document-pickers";
import { reviewModalIconForDocumentType } from "@/lib/ledger-type-icons";
import { OriginalUploadPreviewModal } from "@/components/dashboard/OriginalUploadPreviewModal";
import { ModalFocusSurface } from "@/components/ui/modal-dialog";

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
  document_id?: string | null;
  document_type?: string | null;
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
  onSaved?: (id?: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [scopeItems, setScopeItems] = useState<
    { id: string; category: string; description: string }[]
  >([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [originalPreviewOpen, setOriginalPreviewOpen] = useState(false);
  const [ledgerDocType, setLedgerDocType] =
    useState<LedgerDocumentType>("invoice");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: invData, error: invErr } = await invokeFunction<{
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
        const inv = invData as unknown as {
          invoice: InvoiceData;
          line_items: LineItem[];
          budget_mapping_suggestions?: ScopeSuggestion[];
        };
        const merged = {
          ...inv.invoice,
          line_items: inv.line_items ?? [],
          budget_mapping_suggestions: inv.budget_mapping_suggestions,
        };
        setInvoice(merged);
        setLedgerDocType(coerceLedgerDocumentType(merged.document_type));

        const { data: scope, error: scopeErr } = await supabase
          .from("scope_items")
          .select("id, category, description")
          .eq("project_id", projectId);
        if (cancelled) return;
        if (scopeErr) {
          reportClientError("invoice_review_scope_list", scopeErr);
          toast.error(
            "We couldn’t load your budget breakdown, so some line links may be missing. You can still review amounts—try again shortly or check your connection.",
            { duration: 8000 },
          );
          setScopeItems([]);
        } else {
          setScopeItems(
            (scope ?? []) as {
              id: string;
              category: string;
              description: string;
            }[],
          );
        }

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
    return () => {
      cancelled = true;
    };
  }, [invoiceId, projectId]);

  async function handleSaveMappings() {
    if (!invoice) return;
    setSaving(true);
    try {
      for (const [lineId, scopeItemId] of Object.entries(mappings)) {
        const { error: lineErr } = await supabase
          .from("invoice_line_items")
          .update({ scope_item_id: scopeItemId || null })
          .eq("id", lineId);
        if (lineErr) throw lineErr;
      }

      const prevType = coerceLedgerDocumentType(invoice.document_type);
      const typeChanged = ledgerDocType !== prevType;
      if (typeChanged) {
        const { error: invErr } = await supabase
          .from("invoices")
          .update({ document_type: ledgerDocType })
          .eq("id", invoice.id);
        if (invErr) throw invErr;
        if (invoice.document_id) {
          const { error: docErr } = await supabase
            .from("documents")
            .update({ type: ledgerDocType })
            .eq("id", invoice.document_id);
          if (docErr) throw docErr;
        }
      }

      setInvoice((prev) =>
        prev ? { ...prev, document_type: ledgerDocType } : prev,
      );
      toast.success(
        typeChanged
          ? `Document type updated to ${ledgerDocumentTypeLabel(ledgerDocType)}.`
          : "Changes saved.",
      );
      onSaved?.(projectId);
      onClose();
    } catch {
      setError("We couldn’t save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ModalFocusSurface
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/50"
        ariaLabel="Loading document review"
        onEscape={onClose}
      >
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />

          <p className="text-slate-600">Loading document…</p>
        </div>
      </ModalFocusSurface>
    );
  }

  if (error || !invoice) {
    return (
      <ModalFocusSurface
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/50"
        ariaLabel="Document review error"
        onEscape={onClose}
      >
        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            {error ??
              "We couldn’t open this document. Close and try again from your list."}
          </p>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </ModalFocusSurface>
    );
  }

  const showCapitalLineLink = isCapitalLedgerDocumentType(ledgerDocType);
  const modalTitle = reviewDocumentModalTitle(ledgerDocType);
  const vg = ledgerDocumentVisualGroup(ledgerDocType);
  const headerIconClass =
    vg === "spend"
      ? "text-red-500"
      : vg === "warranty_care"
        ? "text-teal-600"
        : "text-slate-700";
  const HeaderIcon = reviewModalIconForDocumentType(ledgerDocType);

  return (
    <>
      <ModalFocusSurface
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/50 overflow-y-auto"
        titleId="invoice-review-title"
        onEscape={onClose}
        active={!originalPreviewOpen}
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <h3
              id="invoice-review-title"
              className="text-lg font-semibold text-slate-900 flex items-center gap-2"
            >
              <HeaderIcon
                className={`w-5 h-5 shrink-0 ${headerIconClass}`}
                aria-hidden
              />
              {modalTitle}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {showCapitalLineLink ? (
              <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <strong className="text-slate-800">Tip:</strong> Match each line
                to your estimate below so you can see what&apos;s on or off
                budget.
              </p>
            ) : null}
            {invoice.document_id ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto gap-2 rounded-xl"
                onClick={() => setOriginalPreviewOpen(true)}
              >
                <Link2 className="w-4 h-4" aria-hidden />
                View original upload
              </Button>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 space-y-1.5">
              <label
                htmlFor="invoice-review-doc-type"
                className="text-xs font-semibold text-slate-600 uppercase tracking-wide"
              >
                Document type
              </label>
              <select
                id="invoice-review-doc-type"
                value={ledgerDocType}
                onChange={(e) =>
                  setLedgerDocType(e.target.value as LedgerDocumentType)
                }
                className="w-full text-sm font-medium rounded-lg border border-slate-300 bg-white px-2 py-2"
              >
                {ledgerDocumentSelectOptions().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 leading-snug">
                Fix a misclassification here — no need to re-upload. This
                updates your ledger and seller packet grouping.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                  {invoice.vendor_name ?? "Vendor"}
                  {!invoice.vendor_name && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-amber-700 border-amber-200 bg-amber-50"
                    >
                      Needs a quick check
                    </Badge>
                  )}
                </h4>
                <Badge variant="secondary" className="capitalize">
                  {invoice.payment_status}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(invoice.total ?? 0)}
                </p>
                {(!invoice.total || invoice.total === 0) && (
                  <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                    Verify Total
                  </p>
                )}
              </div>
            </div>

            {showCapitalLineLink ? (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Link to budget line (optional)
                </h5>
                <p className="text-xs text-slate-500">
                  Link invoice lines to your budget breakdown to track actual
                  vs. estimate.
                </p>
                {invoice.line_items.map((line) => {
                  const isUnmapped = !(mappings[line.id] ?? line.scope_item_id);
                  const showOverrunHint = isUnmapped && scopeItems.length > 0;
                  return (
                    <Card
                      key={line.id}
                      className={`p-3 ${showOverrunHint ? "border-amber-200 bg-amber-50/50" : ""}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">
                            {line.description}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(line.line_total)}
                          </p>
                          {showOverrunHint && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                              <AlertTriangle
                                className="w-3.5 h-3.5 shrink-0"
                                aria-hidden
                              />
                              Not in your original budget
                            </p>
                          )}
                        </div>
                        <select
                          value={mappings[line.id] ?? line.scope_item_id ?? ""}
                          onChange={(e) =>
                            setMappings((m) => ({
                              ...m,
                              [line.id]: e.target.value,
                            }))
                          }
                          className="text-sm rounded-lg border border-slate-300 px-2 py-1 shrink-0"
                        >
                          <option value="">— Not linked</option>
                          {scopeItems.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveMappings}
                disabled={saving}
                className="flex-1 gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </ModalFocusSurface>
      {originalPreviewOpen ? (
        <OriginalUploadPreviewModal
          key={invoiceId}
          invoiceId={invoiceId}
          onClose={() => setOriginalPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}
