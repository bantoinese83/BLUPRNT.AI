import { motion, AnimatePresence } from "motion/react";
import { Upload, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentUploadHeaderProps {
  uploading: boolean;
  batchStatus?: string | null;
  onUploadClick: () => void;
}

export function DocumentUploadHeader({
  uploading,
  batchStatus,
  onUploadClick,
}: DocumentUploadHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h3 className="text-xl font-black tracking-tight text-slate-900">
        Project documents
      </h3>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative">
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -top-8 left-0 right-0 sm:absolute sm:-left-44 sm:top-1/2 sm:-translate-y-1/2 flex items-center justify-center sm:justify-start gap-2 text-slate-900 text-[10px] font-black overflow-hidden whitespace-nowrap uppercase tracking-widest bg-white/80 backdrop-blur-sm sm:bg-transparent py-1 rounded-full border border-slate-100 sm:border-0 shadow-sm sm:shadow-none"
            >
              <div className="relative">
                <ScanLine className="w-3 h-3 animate-pulse" />
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-x-0 top-0 h-0.5 bg-slate-950 shadow-[0_0_4px_black]"
                />
              </div>
              <span>{batchStatus || "AI READING..."}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
          <p className="text-[11px] text-slate-500 font-medium leading-snug order-2 sm:order-1 sm:max-w-[220px]">
            We auto-classify spending records (bills, quotes, receipts) and
            permanent project files (permits, contracts, warranties, etc.) from
            each file. Change the type in review if needed.
          </p>
          <Button
            variant="outline"
            size="default"
            onClick={onUploadClick}
            disabled={uploading}
            type="button"
            className={cn(
              "flex-1 sm:flex-none rounded-xl font-bold h-10 order-1 sm:order-2",
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
