import { useState } from "react";
import { ModalDialog } from "../ui/modal-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertCircle, Trash2 } from "lucide-react";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}: DeleteProjectModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const isMatch = confirmText.trim() === projectName;

  return (
    <ModalDialog open={isOpen} onClose={onClose} titleId="delete-project-title">
      <div className="space-y-6 pt-4">
        <div>
          <h2
            id="delete-project-title"
            className="text-xl font-black text-slate-900 leading-tight"
          >
            Permanently remove project?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            This action cannot be undone. All associated invoices, estimates,
            and property records will be lost forever.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-900 text-sm animate-in fade-in zoom-in duration-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">DANGER ZONE</p>
            <p className="font-medium opacity-90">
              You are about to delete{" "}
              <strong className="font-black underline decoration-red-500/50">
                {projectName}
              </strong>
              . This will immediately purge all data from our servers.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
            Type project name to confirm
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectName}
            className="h-12 rounded-xl border-red-100 focus:border-red-500 focus:ring-red-500/10 placeholder:opacity-30"
            autoFocus
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
          >
            Go back
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (isMatch) {
                onConfirm();
                setConfirmText("");
              }
            }}
            disabled={!isMatch}
            className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete project
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
}
