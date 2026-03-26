import { motion, AnimatePresence } from "motion/react";
import { Upload, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InvoiceUploadHeaderProps {
  uploading: boolean;
  documentType: "invoice" | "quote" | "warranty" | "permit";
  setDocumentType: (type: "invoice" | "quote" | "warranty" | "permit") => void;
  onUploadClick: () => void;
}

export function InvoiceUploadHeader({
  uploading,
  documentType,
  setDocumentType,
  onUploadClick,
}: InvoiceUploadHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h3 className="text-xl font-black tracking-tight text-slate-900">
        Invoices & documents
      </h3>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative">
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -top-8 left-0 right-0 sm:static sm:absolute sm:-left-36 sm:top-1/2 sm:-translate-y-1/2 flex items-center justify-center sm:justify-start gap-2 text-slate-900 text-[10px] font-black overflow-hidden whitespace-nowrap uppercase tracking-widest bg-white/80 backdrop-blur-sm sm:bg-transparent py-1 rounded-full border border-slate-100 sm:border-0 shadow-sm sm:shadow-none"
            >
              <div className="relative">
                <ScanLine className="w-3 h-3 animate-pulse" />
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-x-0 top-0 h-0.5 bg-slate-950 shadow-[0_0_4px_black]"
                />
              </div>
              <span>AI READING...</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={documentType}
            onChange={(e) =>
              setDocumentType(
                e.target.value as "invoice" | "quote" | "warranty" | "permit",
              )
            }
            className="flex-1 sm:flex-none text-sm font-bold rounded-xl border border-slate-200 pl-3 pr-8 py-2 bg-white shadow-sm focus:ring-2 focus:ring-slate-950/20 focus:border-slate-950 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.5rem_center] bg-no-repeat"
            aria-label="Document type"
          >
            <option value="invoice">Invoice</option>
            <option value="quote">Quote</option>
            <option value="warranty">Warranty</option>
            <option value="permit">Permit</option>
          </select>
          <Button
            variant="outline"
            size="default"
            onClick={onUploadClick}
            disabled={uploading}
            type="button"
            className={cn(
              "flex-1 sm:flex-none rounded-xl font-bold h-10",
              uploading ? "bg-slate-50 border-slate-200" : "",
            )}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-900" />
            ) : (
              <Upload className="w-4 h-4 mr-2 text-slate-500" />
            )}
            {uploading ? "Wait" : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}
