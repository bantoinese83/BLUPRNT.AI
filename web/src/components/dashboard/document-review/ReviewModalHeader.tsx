import { X, Sparkles, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReviewModalHeaderProps {
  title: string;
  isUnverified: boolean;
  headerIconClass: string;
  HeaderIcon: LucideIcon;
  bgClass: string;
  onClose: () => void;
}

export function ReviewModalHeader({
  title,
  isUnverified,
  headerIconClass,
  HeaderIcon,
  bgClass,
  onClose,
}: ReviewModalHeaderProps) {
  return (
    // Solid white base prevents the body content from bleeding through the
    // sticky header (themed `bgClass` values use /50 opacity for a soft tint).
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 supports-[backdrop-filter]:backdrop-blur">
      <div className={`flex items-center justify-between gap-3 p-4 ${bgClass}`}>
        <h3
          id="document-review-title"
          className="text-lg font-semibold text-slate-900 flex items-center gap-2 min-w-0"
        >
          <HeaderIcon
            className={`w-5 h-5 shrink-0 ${headerIconClass}`}
            aria-hidden
          />
          <span className="truncate">{title}</span>
          {isUnverified && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 ml-2 shrink-0"
            >
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              AI Draft
            </Badge>
          )}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
