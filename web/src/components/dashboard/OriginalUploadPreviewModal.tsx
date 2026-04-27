import { useEffect, useState } from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  fetchLedgerEntryOriginalSignedUrl,
  type LedgerEntryOriginalFetchResult,
} from "@/lib/open-original-document";

import { isImageFilename } from "@shared/lib/infer-document-type.ts";

type Phase = "loading" | "ready" | "error";

/** Renders only while open; pass a stable `key` (e.g. ledger entry id) so each open remounts with a fresh loading state. */
export function OriginalUploadPreviewModal({
  ledgerEntryId,
  onClose,
}: {
  ledgerEntryId: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result: LedgerEntryOriginalFetchResult =
        await fetchLedgerEntryOriginalSignedUrl(ledgerEntryId);
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setPhase("error");
        return;
      }
      setSignedUrl(result.signedUrl);
      setFilename(result.filename);
      setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [ledgerEntryId]);

  const title = filename?.trim() || "Original upload";

  return (
    <ModalDialog
      open
      onClose={onClose}
      titleId="original-upload-preview-title"
      overlayClassName="bg-teal-950/60"
      panelClassName="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/80"
      paddingClassName="p-4"
    >
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <h2
          id="original-upload-preview-title"
          className="text-sm font-semibold text-slate-900 truncate min-w-0"
          title={title}
        >
          {title}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {phase === "ready" && signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              Open in new tab
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-50 flex items-center justify-center p-2 sm:p-4">
        {phase === "loading" ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2
              className="w-10 h-10 text-slate-700 animate-spin"
              aria-hidden
            />
            <p className="text-sm text-slate-600">Loading file…</p>
          </div>
        ) : null}

        {phase === "error" && errorMessage ? (
          <div className="max-w-md text-center space-y-4 px-4 py-8">
            <p className="text-sm text-slate-700 leading-relaxed">
              {errorMessage}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Close
            </Button>
          </div>
        ) : null}

        {phase === "ready" && signedUrl ? (
          <div className="w-full h-[min(75vh,720px)] min-h-[240px] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-inner">
            {isImageFilename(filename) && !imageBroken ? (
              <img
                src={signedUrl}
                alt={title}
                className="w-full h-full object-contain bg-slate-100"
                onError={() => setImageBroken(true)}
              />
            ) : null}
            {isImageFilename(filename) && imageBroken ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-slate-700">
                  This file type may not preview in the browser. Use{" "}
                  <span className="font-medium">Open in new tab</span> to view
                  it.
                </p>
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-900 underline underline-offset-2"
                >
                  Open in new tab
                </a>
              </div>
            ) : null}
            {!isImageFilename(filename) ? (
              <iframe
                title={title}
                src={signedUrl}
                className="w-full h-full border-0 bg-white"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </ModalDialog>
  );
}
