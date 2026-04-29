import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  ledgerDocType: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationModal({
  ledgerDocType,
  onCancel,
  onConfirm,
  isDeleting,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-teal-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">
            Delete this {ledgerDocType}?
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            This will permanently remove the document and all associated budget
            mappings from your project. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-rose-600 hover:bg-rose-700 border-rose-700 shadow-rose-200 rounded-xl gap-2"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
