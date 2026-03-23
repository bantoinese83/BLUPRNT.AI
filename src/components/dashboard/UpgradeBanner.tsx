import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FREE_INVOICE_LIMIT = 3;

interface UpgradeBannerProps {
  invoiceCount: number;
  onUpgradeClick: () => void;
}

export function UpgradeBanner({ invoiceCount, onUpgradeClick }: UpgradeBannerProps) {
  if (invoiceCount < FREE_INVOICE_LIMIT) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h4 className="font-semibold text-indigo-900">You&apos;ve used all 3 free invoices on this project.</h4>
          <p className="text-sm text-indigo-700 mt-0.5">
            Quotes, warranties, and permits still upload free. Upgrade for more invoices.
          </p>
        </div>
      </div>
      <Button
        variant="primary"
          className="shrink-0"
        onClick={onUpgradeClick}
        type="button"
      >
        <Sparkles className="w-4 h-4 shrink-0" aria-hidden />
        See upgrade options
      </Button>
    </div>
  );
}
