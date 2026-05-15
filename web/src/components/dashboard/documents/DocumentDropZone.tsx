import { useRef } from "react";
import { Upload, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

type DocumentDropZoneProps = {
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  dropActive: boolean;
  uploading: boolean;
  blockRecordOnlyUpload: boolean;
  openFileUpload: () => void;
};

export function DocumentDropZone({
  onDragOver,
  onDragLeave,
  onDrop,
  dropActive,
  uploading,
  blockRecordOnlyUpload,
  openFileUpload,
}: DocumentDropZoneProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={dropZoneRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={openFileUpload}
      className={cn(
        "relative overflow-hidden group cursor-pointer transition-all duration-500",
        "border-2 border-dashed rounded-[2.5rem] p-12",
        "flex flex-col items-center justify-center text-center space-y-4",
        dropActive
          ? "border-teal-500 bg-teal-50/50 scale-[1.01] shadow-2xl shadow-teal-500/10"
          : "border-slate-200/60 bg-white hover:border-teal-400/50 hover:bg-slate-50/50 shadow-sm",
        (uploading || blockRecordOnlyUpload) && "opacity-50 cursor-not-allowed",
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500",
            dropActive
              ? "bg-teal-500 text-white rotate-12 scale-110"
              : "bg-teal-50 text-teal-600 group-hover:bg-teal-100 group-hover:scale-110",
          )}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>
        {!uploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center"
          >
            <FileText className="w-4 h-4 text-teal-500" />
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {dropActive ? "Drop to Process" : "High-Density AI Intake"}
        </h3>
        <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
          {uploading
            ? "Our AI is currently cataloging your project data..."
            : "Drag & drop invoices, receipts, or contracts to bulk-process your ledger."}
        </p>
      </div>

      <div className="pt-2 flex items-center gap-3">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center"
            >
              <div className="w-1 h-1 rounded-full bg-slate-300" />
            </div>
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Supported: PDF, JPG, PNG
        </span>
      </div>

      {dropActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-teal-500/5 backdrop-blur-[2px] pointer-events-none"
        />
      )}
    </div>
  );
}
