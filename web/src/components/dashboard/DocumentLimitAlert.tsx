import { Button } from "@/components/ui/button";

interface DocumentLimitAlertProps {
  isArchitectAtGlobalLimit: boolean;
  freeLimit: number;
  onUpgradeClick: (reason?: "ledger_limit") => void;
}

export function DocumentLimitAlert({
  isArchitectAtGlobalLimit,
  freeLimit,
  onUpgradeClick,
}: DocumentLimitAlertProps) {
  return (
    <div className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-2 leading-relaxed">
      <p>
        {isArchitectAtGlobalLimit ? (
          <>
            You&apos;ve used all <strong>10 global uploads</strong> for this
            billing period. Your quota will reset when your subscription renews.
          </>
        ) : (
          <>
            You&apos;ve used all{" "}
            <strong>{freeLimit} free spending document</strong> uploads on this
            project. Upgrade to add more anytime.
          </>
        )}
      </p>
      <p className="text-slate-600">
        <strong>Good news:</strong> quotes, estimates, permits, warranties, and
        other record types don&apos;t count toward that cap—only vendor invoices
        and store receipts do.
      </p>
      <Button
        type="button"
        size="sm"
        variant="primary"
        className="rounded-xl mt-1"
        onClick={() => onUpgradeClick("ledger_limit")}
      >
        {isArchitectAtGlobalLimit ? "View subscription" : "See upgrade options"}
      </Button>
    </div>
  );
}
