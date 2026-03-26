import { useState } from "react";
import {
  Copy,
  Check,
  Loader2,
  X,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateProjectShareLink } from "@/lib/share-project";

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
};

export function ShareModal({ isOpen, onClose, projectId }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setShareUrl(null);
    setShareError(null);
    setShareLoading(true);
    const result = await generateProjectShareLink(projectId);

    // Artificial delay for premium feel
    setTimeout(() => {
      setShareLoading(false);
      if (result.ok && result.url) {
        setShareUrl(result.url);
      } else {
        setShareError(result.message ?? "Couldn't create link.");
      }
    }, 800);
  }

  // Trigger share only once when modal opens
  useState(() => {
    if (isOpen) handleShare();
  });

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("Couldn't copy to clipboard.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 space-y-6 relative overflow-hidden border border-slate-100 ring-1 ring-slate-200/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Share Project
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-2xl"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {shareLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full scale-150 animate-pulse" />
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative" />
            </div>
            <p className="font-black text-slate-400 animate-pulse tracking-widest uppercase text-[9px]">
              Generating Secure View...
            </p>
          </div>
        ) : shareError ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 animate-in shake duration-500">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-sm text-rose-900 font-medium leading-tight">
              {shareError}
            </p>
          </div>
        ) : shareUrl ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4">
              <div className="flex gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Privacy Active
                </h4>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Viewers only see your project scope and budget baseline.
                Invoices, receipts, and personal notes are kept private.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Secure Link
                </label>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                  Active 30d
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm text-slate-700 bg-slate-50 focus:outline-none transition-all group-hover:border-slate-300"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCopy}
                  className="shrink-0 rounded-2xl px-5 h-auto transition-all premium-gradient"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleShare}
            className="w-full h-14 rounded-2xl px-6 premium-gradient font-bold"
          >
            Create Secure Link
          </Button>
        )}
      </div>
    </div>
  );
}
