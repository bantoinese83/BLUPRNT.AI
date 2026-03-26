import { CreditCard, Crown, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BillingCardProps {
  isArchitect: boolean;
  onUpgradeClick: () => void;
}

export function BillingCard({ isArchitect, onUpgradeClick }: BillingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Plan & Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isArchitect
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {isArchitect ? (
                <Crown className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                {isArchitect ? "Architect Plan" : "Free Plan"}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {isArchitect
                  ? "Active Monthly Subscription • 10 scans/mo"
                  : "Free Plan • 3 scans per project"}
              </p>
            </div>
          </div>
          <Button
            variant={isArchitect ? "outline" : "primary"}
            size="sm"
            className="rounded-xl shadow-sm"
            onClick={onUpgradeClick}
            type="button"
          >
            {isArchitect ? "View Plan Options" : "Upgrade"}
          </Button>
        </div>

        {!isArchitect && (
          <p className="text-xs text-slate-500 leading-relaxed px-1 font-medium">
            Upgrade to Architect for{" "}
            <span className="text-slate-900">
              Advanced AI Project Strategies
            </span>
            , 10 smart invoice scans per billing period, and priority support.
          </p>
        )}
        {isArchitect && (
          <p className="text-xs text-slate-500 leading-relaxed px-1">
            You have active professional features. Billing is handled through
            Stripe.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
