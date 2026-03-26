import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FilePlus2,
  Share2,
  Copy,
  Check,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateProjectShareLink } from "@/lib/share-project";

import type { ProjectRow } from "@/types/database";

export function ProjectHeader({ project }: { project: ProjectRow }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setShareOpen(true);
    setShareUrl(null);
    setShareError(null);
    setShareLoading(true);
    const result = await generateProjectShareLink(project.id);
    setShareLoading(false);
    if (result.ok && result.url) {
      setShareUrl(result.url);
    } else {
      setShareError(result.message ?? "Couldn't create link.");
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("Couldn't copy to clipboard.");
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-slate-900 text-white border-slate-800 gap-1.5 font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Active project
          </Badge>
          {project.estimated_max_total &&
            project.estimated_max_total > 30000 && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200/50 gap-1.5 font-bold animate-in fade-in slide-in-from-left-2 duration-500"
              >
                <AlertTriangle className="w-3 h-3" />
                High Value Project
              </Badge>
            )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          {project.name}
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          className="bg-white gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
          type="button"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 shrink-0" aria-hidden />
          Share project view
        </Button>
        {shareOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Share project view
                </h3>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {shareLoading ? (
                <div className="flex items-center gap-2 text-slate-500 py-4">
                  <Loader2
                    className="w-5 h-5 text-slate-900 animate-spin"
                    aria-hidden
                  />

                  <span>Creating link…</span>
                </div>
              ) : shareError ? (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  {shareError}
                </p>
              ) : shareUrl ? (
                <div className="space-y-3">
                  <p className="text-sm text-amber-900/90 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 leading-relaxed">
                    <strong className="font-semibold">Privacy:</strong> They
                    only see your estimate and scope—not invoices, uploads, or
                    personal details.
                  </p>
                  <p className="text-sm text-slate-600">
                    The link expires in 30 days. Anyone with it can view that
                    read-only page.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 bg-slate-50"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleCopy}
                      className="shrink-0 gap-2"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" aria-hidden />
                      ) : (
                        <Copy className="w-4 h-4" aria-hidden />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
        <Link to="/dashboard/execute?type=quote">
          <Button
            variant="primary"
            type="button"
            className="rounded-xl shadow-sm w-full sm:w-auto"
          >
            <FilePlus2 className="w-4 h-4 shrink-0" aria-hidden />
            Add quote
          </Button>
        </Link>
      </div>
    </div>
  );
}
