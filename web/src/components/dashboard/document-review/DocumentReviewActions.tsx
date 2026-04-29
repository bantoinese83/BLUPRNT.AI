import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentReviewActionsProps {
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  isProcessing: boolean;
  isUnverified: boolean;
}

export function DocumentReviewActions({
  onDelete,
  onCancel,
  onSave,
  isSaving,
  isDeleting,
  isProcessing,
  isUnverified,
}: DocumentReviewActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 pt-4">
      <Button
        variant="ghost"
        onClick={onDelete}
        disabled={isDeleting || isSaving}
        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2 order-2 sm:order-1"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        Delete
      </Button>
      <div className="flex-1 flex gap-2 order-1 sm:order-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={isProcessing}
          className={cn(
            "flex-1 gap-2 relative overflow-hidden group",
            isUnverified &&
              "bg-amber-600 hover:bg-amber-700 border-amber-700 shadow-amber-200",
          )}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isUnverified ? (
            <>
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="flex items-center gap-1.5">
                Verify & Save
                <kbd className="hidden sm:inline-block text-[10px] font-black bg-amber-800/20 px-1 rounded ml-1">
                  ⌘+Enter
                </kbd>
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              Save changes
              <kbd className="hidden sm:inline-block text-[10px] font-black bg-slate-800/10 px-1 rounded ml-1">
                ⌘+Enter
              </kbd>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
