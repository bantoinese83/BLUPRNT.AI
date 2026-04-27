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
    <div
      className={`sticky top-0 border-b border-slate-200 p-4 flex items-center justify-between z-10 ${bgClass}`}
    >
      <h3
        id="document-review-title"
        className="text-lg font-semibold text-slate-900 flex items-center gap-2"
      >
        <HeaderIcon
          className={`w-5 h-5 shrink-0 ${headerIconClass}`}
          aria-hidden
        />
        {title}
        {isUnverified && (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 ml-2"
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
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
