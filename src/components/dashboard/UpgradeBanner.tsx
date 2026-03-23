import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeIcon } from "@/components/ui/UpgradeIcon";

const FREE_INVOICE_LIMIT = 3;

interface UpgradeBannerProps {
  invoiceCount: number;
  onUpgradeClick: () => void;
}

export function UpgradeBanner({ invoiceCount, onUpgradeClick }: UpgradeBannerProps) {
  if (invoiceCount < FREE_INVOICE_LIMIT) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-slate-900" />
        </div>

        <div>
          <h4 className="font-semibold text-slate-900">You&apos;ve used all 3 free invoices on this project.</h4>
          <p className="text-sm text-slate-600 mt-0.5">
            Quotes, warranties, and permits still upload free. Upgrade for more invoices.
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        className="shrink-0 premium-gradient"
        onClick={onUpgradeClick}
        type="button"
      >
        <UpgradeIcon className="shrink-0 mr-2" aria-hidden />

        See upgrade options
      </Button>
    </div>
  );
}
