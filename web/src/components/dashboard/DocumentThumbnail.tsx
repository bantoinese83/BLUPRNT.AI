import { useState, useEffect } from "react";
import { Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { fetchInvoiceOriginalSignedUrl } from "@/lib/open-original-document";
import { cn } from "@/lib/utils";

interface DocumentThumbnailProps {
  invoiceId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function isImageFilename(name?: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name ?? "");
}

export function DocumentThumbnail({
  invoiceId,
  className,
  size = "md",
}: DocumentThumbnailProps) {
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | undefined>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadThumbnail = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await fetchInvoiceOriginalSignedUrl(invoiceId, {
          width: size === "sm" ? 80 : size === "md" ? 160 : 320,
          height: size === "sm" ? 80 : size === "md" ? 160 : 320,
          resize: "contain",
        });
        if (cancelled) return;
        if (result.ok) {
          setUrl(result.signedUrl);
          setFilename(result.filename);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadThumbnail();
    return () => {
      cancelled = true;
    };
  }, [invoiceId, size]);

  const dimensions =
    size === "sm" ? "w-10 h-10" : size === "md" ? "w-16 h-16" : "w-24 h-24";

  if (loading) {
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

  const isImg = isImageFilename(filename);
  const isPdf = filename?.toLowerCase().endsWith(".pdf");

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-white border border-slate-200 rounded-lg shrink-0 overflow-hidden shadow-sm transition-all group-hover:border-slate-300",
        dimensions,
        className,
      )}
    >
      {isImg && url && !error ? (
        <img
          src={url}
          alt="Thumbnail"
          className="w-full h-full object-cover"
          onError={() => setError(true)}
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
              <FileText
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
