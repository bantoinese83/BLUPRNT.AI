import { useState } from "react";
import { Eye, Clock, Lock, Sparkles } from "lucide-react";
import { DocumentThumbnail } from "@/components/dashboard/DocumentThumbnail";
import { OriginalUploadPreviewModal } from "@/components/dashboard/OriginalUploadPreviewModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import type { InvoiceRow } from "@shared/types/database";
import { money, getWarrantyStatus } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  ledgerDocumentTypeLabel,
  ledgerDocumentVisualGroup,
} from "@shared/lib/ledger-document-labels";
import { isPlanVsActualDocumentType } from "@shared/lib/infer-document-type";

interface DocumentCardProps {
  document: InvoiceRow;
  index: number;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
  onClick: (id: string) => void;
}

export function DocumentCard({
  document,
  index,
  hasProjectPass,
  onUpgradeClick,
  onClick,
}: DocumentCardProps) {
  const [originalPreviewId, setOriginalPreviewId] = useState<string | null>(
    null,
  );

  const visual = ledgerDocumentVisualGroup(document.document_type);
  const isSpend = visual === "spend";
  const isWarrantyCare = visual === "warranty_care";
  const showPaymentBadge = isPlanVsActualDocumentType(
    document.document_type ?? "invoice",
  );
  const warranty =
    document.document_type === "quote"
      ? null
      : getWarrantyStatus(document.warranty_expiry_date);
  const isWarrantyUnlocked = hasProjectPass;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card
          className="border-slate-200/80 shadow-drop-sm hover:shadow-drop-lg hover:border-slate-400 transition-all duration-300 cursor-pointer overflow-hidden group relative"
          onClick={() => onClick(document.id)}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 flex items-start space-x-4">
            <DocumentThumbnail
              invoiceId={document.id}
              size="sm"
              className="mt-0.5"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-slate-900 text-sm truncate group-hover:text-slate-950 transition-colors">
                  {document.vendor_name &&
                  document.vendor_name !== "Processing..."
                    ? document.vendor_name
                    : ledgerDocumentTypeLabel(
                        document.document_type ?? "invoice",
                      ).split(" / ")[0]}
                </h4>
                <AnimatePresence>
                  {document.is_verified === false && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5, y: -5 }}
                      className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0 shadow-sm shadow-amber-100/50"
                    >
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                      AI Draft
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-xs text-slate-500">
                {new Date(document.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {showPaymentBadge && document.total != null && (
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  {money(document.total)}
                </p>
              )}
              <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                <Badge
                  variant="secondary"
                  className={cn(
                    "capitalize text-[10px] font-black tracking-widest",
                    isSpend
                      ? "bg-rose-100 text-rose-950"
                      : isWarrantyCare
                        ? "bg-teal-100 text-teal-950"
                        : "bg-slate-100 text-slate-700",
                  )}
                >
                  {ledgerDocumentTypeLabel(document.document_type ?? "invoice")}
                </Badge>

                {warranty &&
                  (isWarrantyUnlocked ? (
                    <div
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ring-1",
                        warranty.isExpired
                          ? "bg-rose-50 text-rose-600 ring-rose-100"
                          : "bg-teal-50 text-teal-600 ring-teal-100",
                      )}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {warranty.label}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpgradeClick?.();
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-wider ring-1 ring-amber-100 hover:bg-amber-100 transition-colors"
                    >
                      <Lock className="w-2 h-2" />
                      Track Warranty
                    </button>
                  ))}

                {showPaymentBadge && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 capitalize text-[10px] font-black tracking-widest"
                  >
                    {document.payment_status === "unpaid"
                      ? "Unpaid"
                      : document.payment_status}
                  </Badge>
                )}
              </div>
              {document.document_id ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOriginalPreviewId(document.id);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  View original
                </button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {originalPreviewId ? (
        <OriginalUploadPreviewModal
          key={originalPreviewId}
          invoiceId={originalPreviewId}
          onClose={() => setOriginalPreviewId(null)}
        />
      ) : null}
    </>
  );
}
