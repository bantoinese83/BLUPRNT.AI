import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import type { InvoiceRow } from "@/types/database";

interface InvoiceCardProps {
  invoice: InvoiceRow;
  index: number;
  onClick: (id: string) => void;
}

export function InvoiceCard({ invoice, index, onClick }: InvoiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-400 transition-all cursor-pointer overflow-hidden group relative"
        onClick={() => onClick(invoice.id)}
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-4 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
            <FileText className="w-5 h-5 text-red-500" />
          </div>
          <div className="space-y-1 min-w-0">
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
              <p className="text-sm font-medium text-slate-800">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(invoice.total)}
              </p>
            )}
            <div className="pt-2 flex flex-wrap gap-1.5">
              <Badge
                variant="secondary"
                className={`capitalize text-xs ${
                  (invoice.document_type ?? "invoice") !== "invoice"
                    ? "bg-slate-200 text-slate-950 font-bold"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {invoice.document_type ?? "invoice"}
              </Badge>
              {(invoice.document_type ?? "invoice") === "invoice" && (
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 capitalize"
                >
                  {invoice.payment_status === "unpaid"
                    ? "Unpaid"
                    : invoice.payment_status}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
