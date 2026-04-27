import { useState } from "react";
import { FileTextIcon, ImageIcon, Loader2 } from "lucide-react";
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
}

export function DocumentThumbnail({
  ledgerEntryId,
  className,
  size = "md",
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

  if (isLoading) {
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
  const { filename, signedUrl: url } = data || {};
  const isImg = isImageFilename(filename);
  const isPdf = isPdfFilename(filename);

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
            "w-full h-full flex flex-col items-center justify-center text-slate-400 gap-0.5",
            isPdf ? "bg-rose-50/50" : "bg-slate-50",
          )}
        >
          {isPdf ? (
            <>
              <FileTextIcon
                className={cn(
                  "text-rose-600/80",
                  size === "sm" ? "w-5 h-5" : "w-7 h-7",
                )}
              />
              {size !== "sm" && (
                <span className="text-[10px] font-black text-rose-700/60 uppercase tracking-tighter">
                  PDF
                </span>
              )}
            </>
          ) : (
            <ImageIcon className={size === "sm" ? "w-5 h-5" : "w-7 h-7"} />
          )}
        </div>
      )}
    </div>
  );
}
