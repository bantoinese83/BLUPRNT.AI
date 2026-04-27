import { useState } from "react";
import { FileText, ImageIcon, Loader2 } from "lucide-react";
import { useDocumentSignedUrl } from "@shared/hooks/use-document-signed-url";
import { supabase } from "@/lib/supabase";
import {
  isImageFilename,
  isPdfFilename,
} from "@shared/lib/infer-document-type.ts";
import { cn } from "@/lib/utils";

interface DocumentThumbnailProps {
  ledgerEntryId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fileType?: string | null;
}

export function DocumentThumbnail({
  ledgerEntryId,
  className,
  size = "md",
  fileType,
}: DocumentThumbnailProps) {
  const [imgError, setImgError] = useState(false);
  const { data, isLoading, isError } = useDocumentSignedUrl(
    supabase,
    ledgerEntryId,
    {
      width: size === "sm" ? 80 : size === "md" ? 160 : 320,
      height: size === "sm" ? 80 : size === "md" ? 160 : 320,
      resize: "contain",
    },
  );

  const dimensions =
    size === "sm" ? "w-10 h-10" : size === "md" ? "w-16 h-16" : "w-24 h-24";

  const { filename, signedUrl: url } = data || {};

  // Use provided fileType or infer from filename
  const isPdf =
    fileType === "pdf" ||
    isPdfFilename(filename || (fileType?.endsWith(".pdf") ? "f.pdf" : ""));
  const isImg =
    !isPdf && (isImageFilename(filename) || (!filename && fileType !== "pdf"));

  if (isLoading && !fileType) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg shrink-0",
          dimensions,
          className,
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-white border border-slate-200 rounded-lg shrink-0 overflow-hidden shadow-sm transition-all group-hover:border-slate-300",
        dimensions,
        className,
      )}
    >
      {isImg && url && !isError && !imgError ? (
        <img
          src={url}
          alt="Thumbnail"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex flex-col items-center justify-center text-slate-400 gap-0.5 transition-colors relative",
            isPdf ? "bg-rose-50" : "bg-slate-50",
          )}
        >
          {isPdf ? (
            <>
              <FileText
                className={cn(
                  "text-rose-500",
                  size === "sm"
                    ? "w-5 h-5"
                    : size === "md"
                      ? "w-7 h-7"
                      : "w-10 h-10",
                )}
                strokeWidth={2.5}
              />
              {size !== "sm" && (
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">
                  PDF
                </span>
              )}
            </>
          ) : (
            <ImageIcon className={size === "sm" ? "w-5 h-5" : "w-7 h-7"} />
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
