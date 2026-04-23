import { useState } from "react";
import { Eye, FileText, ShieldCheck, Clock } from "lucide-react";
import { OriginalUploadPreviewModal } from "@/components/dashboard/OriginalUploadPreviewModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import type { InvoiceRow } from "@shared/types/database";
import { money, getWarrantyStatus } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface InvoiceCardProps {
  invoice: InvoiceRow;
  index: number;
  onClick: (id: string) => void;
}

export function InvoiceCard({ invoice, index, onClick }: InvoiceCardProps) {
  const [originalPreviewId, setOriginalPreviewId] = useState<string | null>(
    null,
  );

  const isWarranty = (invoice.document_type || "").toLowerCase() === "warranty";
  const warranty = getWarrantyStatus(invoice.warranty_expiry_date);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card
          className="border-slate-200/80 shadow-drop-sm hover:shadow-drop-lg hover:border-slate-400 transition-all duration-300 cursor-pointer overflow-hidden group relative"
          onClick={() => onClick(invoice.id)}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 flex items-start space-x-4">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                isWarranty
                  ? "bg-teal-50 group-hover:bg-teal-100"
                  : "bg-red-50 group-hover:bg-red-100",
              )}
            >
              {isWarranty ? (
                <ShieldCheck className="h-5 w-5 text-teal-600" />
              ) : (
                <FileText className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="font-semibold text-slate-900 text-sm truncate group-hover:text-slate-950 transition-colors">
                {invoice.vendor_name ?? "Invoice"}
              </h4>
              <p className="text-xs text-slate-500">
                {new Date(invoice.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {invoice.total != null && (
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  {money(invoice.total)}
                </p>
              )}
              <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                <Badge
                  variant="secondary"
                  className={cn(
                    "capitalize text-[10px] font-black tracking-widest",
                    isWarranty
                      ? "bg-teal-100 text-teal-950"
                      : "bg-slate-100 text-slate-700",
                  )}
                >
                  {invoice.document_type ?? "invoice"}
                </Badge>

                {warranty && (
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
                )}

                {(invoice.document_type ?? "invoice") === "invoice" && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 capitalize text-[10px] font-black tracking-widest"
                  >
                    {invoice.payment_status === "unpaid"
                      ? "Unpaid"
                      : invoice.payment_status}
                  </Badge>
                )}
              </div>
              {invoice.document_id ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOriginalPreviewId(invoice.id);
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
