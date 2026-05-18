import { Button } from "@/components/ui/button";
import { ledgerUploadLimitUiCopy } from "@shared/lib/ledger-upload-ui-copy";
import type { LedgerUploadBlockReason } from "@shared/lib/ledger-upload-client-gate";

interface DocumentLimitAlertProps {
  blockReason: Exclude<LedgerUploadBlockReason, null>;
  onUpgradeClick: (reason?: "ledger_limit") => void;
}

export function DocumentLimitAlert({
  blockReason,
  onUpgradeClick,
}: DocumentLimitAlertProps) {
  const copy = ledgerUploadLimitUiCopy(blockReason);
  if (!copy) return null;

  return (
    <div
      role="alert"
      className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-2 leading-relaxed"
    >
      <p className="font-medium text-slate-900">{copy.title}</p>
      <p>{copy.body}</p>
      <p className="text-slate-600">{copy.quotaHint}</p>
      <Button
        type="button"
        size="sm"
        variant="primary"
        className="rounded-xl mt-1"
        onClick={() => onUpgradeClick("ledger_limit")}
      >
        {copy.cta}
      </Button>
    </div>
  );
}
