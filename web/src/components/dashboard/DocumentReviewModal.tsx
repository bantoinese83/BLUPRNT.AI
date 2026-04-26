import { useState, useEffect, useCallback } from "react";
import { Loader2, Link2, Sparkles } from "lucide-react";
import { DocumentThumbnail } from "@/components/dashboard/DocumentThumbnail";
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
  defaultVendorNameForDocumentType,
} from "@shared/lib/ledger-document-labels";
import { reviewModalIconForDocumentType } from "@/lib/ledger-type-icons";
import { OriginalUploadPreviewModal } from "@/components/dashboard/OriginalUploadPreviewModal";
import { ModalFocusSurface } from "@/components/ui/modal-dialog";
import { getUserFriendlyErrorMessage } from "@shared/lib/user-friendly-errors";
import { cn } from "@/lib/utils";

// Sub-components
import { ReviewModalHeader } from "./document-review/ReviewModalHeader";
import { MetadataSection } from "./document-review/MetadataSection";
import { LineItemCard } from "./document-review/LineItemCard";

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

type DocumentData = {
  id: string;
  vendor_name: string | null;
  total: number | null;
  subtotal: number | null;
  payment_status: string;
  line_items: LineItem[];
  budget_mapping_suggestions?: ScopeSuggestion[];
  document_id?: string | null;
  document_type?: string | null;
  warranty_expiry_date?: string | null;
  is_verified?: boolean;
};

export function DocumentReviewModal({
  documentId,
  projectId,
  onClose,
  onSaved,
}: {
  documentId: string;
  projectId: string;
  onClose: () => void;
  onSaved?: (id?: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [scopeItems, setScopeItems] = useState<
    { id: string; category: string; description: string }[]
  >([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [originalPreviewOpen, setOriginalPreviewOpen] = useState(false);
  const [ledgerDocType, setLedgerDocType] =
    useState<LedgerDocumentType>("invoice");
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState<string>("");

  const handleSaveMappings = useCallback(async () => {
    if (!document || saving) return;
    setSaving(true);
    try {
      const lineUpdates = Object.entries(mappings).map(
        ([lineId, scopeItemId]) =>
          supabase
            .from("invoice_line_items")
            .update({ scope_item_id: scopeItemId || null })
            .eq("id", lineId),
      );

      const results = await Promise.all(lineUpdates);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      const prevType = coerceLedgerDocumentType(document.document_type);
      const typeChanged = ledgerDocType !== prevType;
      const dateChanged =
        warrantyExpiryDate !== (document.warranty_expiry_date || "");
      const needsVerification = document.is_verified === false;

      if (typeChanged || dateChanged || needsVerification) {
        const { error: invErr } = await supabase
          .from("invoices")
          .update({
            document_type: ledgerDocType,
            warranty_expiry_date: warrantyExpiryDate || null,
            is_verified: true, // Always verify on manual save
          })
          .eq("id", document.id);
        if (invErr) throw invErr;

        if (typeChanged && document.document_id) {
          const { error: docErr } = await supabase
            .from("documents")
            .update({ type: ledgerDocType })
            .eq("id", document.document_id);
          if (docErr) throw docErr;
        }
      }

      setDocument((prev) =>
        prev
          ? { ...prev, document_type: ledgerDocType, is_verified: true }
          : prev,
      );
      toast.success(
        needsVerification
          ? "Document verified and saved."
          : typeChanged
            ? `Document type updated to ${ledgerDocumentTypeLabel(ledgerDocType)}.`
            : "Changes saved.",
      );
      onSaved?.(projectId);
      onClose();
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [
    document,
    saving,
    mappings,
    ledgerDocType,
    warrantyExpiryDate,
    projectId,
    onSaved,
    onClose,
  ]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSaveMappings();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveMappings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: invData, error: invErr } = await invokeFunction<{
          invoice: DocumentData;
          line_items: LineItem[];
          budget_mapping_suggestions?: ScopeSuggestion[];
        }>("get-invoice", {
          body: { invoice_id: documentId },
        });
        if (cancelled) return;
        if (invErr || !invData) {
          setError("Couldn't load document.");
          setLoading(false);
          return;
        }
        const inv = invData as unknown as {
          invoice: DocumentData;
          line_items: LineItem[];
          budget_mapping_suggestions?: ScopeSuggestion[];
        };
        const merged = {
          ...inv.invoice,
          line_items: inv.line_items ?? [],
          budget_mapping_suggestions: inv.budget_mapping_suggestions,
        };
        setDocument(merged);
        setLedgerDocType(coerceLedgerDocumentType(merged.document_type));
        setWarrantyExpiryDate(merged.warranty_expiry_date || "");

        const { data: scope, error: scopeErr } = await supabase
          .from("scope_items")
          .select("id, category, description")
          .eq("project_id", projectId);
        if (cancelled) return;
        if (scopeErr) {
          reportClientError("document_review_scope_list", scopeErr);
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
  }, [documentId, projectId]);

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

  if (error || !document) {
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
  const isUnverified = document.is_verified === false;

  return (
    <>
      <ModalFocusSurface
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/50 overflow-y-auto"
        titleId="document-review-title"
        onEscape={onClose}
        active={!originalPreviewOpen}
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <ReviewModalHeader
            title={modalTitle}
            isUnverified={isUnverified}
            headerIconClass={headerIconClass}
            HeaderIcon={HeaderIcon}
            onClose={onClose}
          />

          <div className="p-4 space-y-4">
            {isUnverified ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">
                    Review and Verify
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This data was extracted by AI. Please confirm the vendor,
                    amounts, and line links before verifying. Once saved, this
                    becomes a verified record in your ledger.
                  </p>
                </div>
              </div>
            ) : showCapitalLineLink ? (
              <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <strong className="text-slate-800">Tip:</strong> Match each line
                to your estimate below so you can see what&apos;s on or off
                budget.
              </p>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {document.id && (
                <DocumentThumbnail
                  invoiceId={document.id}
                  size="lg"
                  className="w-full sm:w-32 sm:h-32 rounded-2xl shadow-drop-md border-slate-200"
                />
              )}
              <div className="flex-1 w-full space-y-4">
                {document.document_id ? (
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

                <MetadataSection
                  ledgerDocType={ledgerDocType}
                  onDocTypeChange={setLedgerDocType}
                  warrantyExpiryDate={warrantyExpiryDate}
                  onWarrantyDateChange={setWarrantyExpiryDate}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                  {document.vendor_name &&
                  document.vendor_name !== "Vendor" &&
                  document.vendor_name !== "Document"
                    ? document.vendor_name
                    : defaultVendorNameForDocumentType(ledgerDocType)}
                  {(!document.vendor_name ||
                    document.vendor_name === "Vendor" ||
                    document.vendor_name === "Document") &&
                    showCapitalLineLink && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-700 border-amber-200 bg-amber-50"
                      >
                        Needs a quick check
                      </Badge>
                    )}
                </h4>
                {showCapitalLineLink && (
                  <Badge variant="secondary" className="capitalize">
                    {document.payment_status}
                  </Badge>
                )}
              </div>
              {showCapitalLineLink && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(document.total ?? 0)}
                  </p>
                  {(!document.total || document.total === 0) && (
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                      Verify Total
                    </p>
                  )}
                </div>
              )}
            </div>

            {showCapitalLineLink ? (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Link to budget line (optional)
                </h5>
                <p className="text-xs text-slate-500">
                  Link document lines to your budget breakdown to track actual
                  vs. estimate.
                </p>
                {document.line_items.map((line) => (
                  <LineItemCard
                    key={line.id}
                    line={line}
                    mapping={mappings[line.id]}
                    scopeItems={scopeItems}
                    onMappingChange={(lineId, scopeItemId) =>
                      setMappings((m) => ({ ...m, [lineId]: scopeItemId }))
                    }
                  />
                ))}
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
                className={cn(
                  "flex-1 gap-2 relative overflow-hidden group",
                  isUnverified &&
                    "bg-amber-600 hover:bg-amber-700 border-amber-700 shadow-amber-200",
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isUnverified ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="flex items-center gap-1.5">
                      Verify & Save
                      <kbd className="hidden sm:inline-block text-[10px] font-black bg-amber-800/20 px-1 rounded ml-1">
                        ⌘+Enter
                      </kbd>
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Save changes
                    <kbd className="hidden sm:inline-block text-[10px] font-black bg-slate-800/10 px-1 rounded ml-1">
                      ⌘+Enter
                    </kbd>
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </ModalFocusSurface>
      {originalPreviewOpen ? (
        <OriginalUploadPreviewModal
          key={documentId}
          invoiceId={documentId}
          onClose={() => setOriginalPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}
