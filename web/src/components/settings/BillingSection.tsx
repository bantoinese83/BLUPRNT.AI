import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PRICING } from "@shared/constants/pricing";
import {
  ArchitectPlanIcon,
  ProjectPassIcon,
} from "@/components/icons/PlanMarks";
import {
  architectBillingChannel,
  hasDuplicateWebAndStoreSubscriptions,
} from "@shared/lib/subscription-billing";
import { invokeFunction } from "@/lib/supabase";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing";

import type { UserSubscriptionRow } from "@shared/types/database";

type BillingSectionProps = {
  isArchitect: boolean;
  subscriptionRow: UserSubscriptionRow | null;
  setShowUpgrade: (val: boolean) => void;
};

export function BillingSection({
  isArchitect,
  subscriptionRow,
  setShowUpgrade,
}: BillingSectionProps) {
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleManagePlan = async () => {
    if (!isArchitect) {
      setShowUpgrade(true);
      return;
    }

    // If subscribed via App Store, we can't manage via Stripe portal
    if (
      subscriptionRow &&
      architectBillingChannel(subscriptionRow) === "store"
    ) {
      setShowUpgrade(true); // Or maybe show a specific "Manage in App Store" message
      return;
    }

    setLoadingPortal(true);
    try {
      const { data, error } = await invokeFunction<{ url: string }>(
        EDGE_FUNCTIONS.CREATE_PORTAL_SESSION,
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to open billing portal:", err);
      // Fallback to upgrade modal which at least shows current status
      setShowUpgrade(true);
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <CreditCard className="w-5 h-5 text-teal-500" />
          Plan & Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {isArchitect &&
          subscriptionRow &&
          hasDuplicateWebAndStoreSubscriptions(subscriptionRow) && (
            <div
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              <p className="font-bold text-amber-950 mb-1">
                Possible duplicate subscription
              </p>
              <p className="font-medium leading-relaxed text-amber-950/95">
                We see both a web (Stripe) subscription and an app store
                subscription. Cancel one to avoid paying twice — use the Stripe
                customer portal for web, or Subscriptions in the App Store for
                the iOS app.
              </p>
            </div>
          )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-50/80 border border-slate-200 rounded-3xl gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isArchitect ? "bg-slate-900 text-white shadow-slate-700/50" : "bg-white text-slate-400 shadow-slate-200/50 border border-slate-100"}`}
            >
              {isArchitect ? (
                <ArchitectPlanIcon className="w-8 h-8" />
              ) : (
                <ProjectPassIcon className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-base font-black text-slate-900 leading-none">
                {isArchitect ? "Architect Plan" : "Free Explorer"}
              </p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                {isArchitect
                  ? "Active Monthly Subscription"
                  : "Standard Features Only"}
              </p>
            </div>
          </div>
          <Button
            variant={isArchitect ? "outline" : "primary"}
            size="lg"
            className={`rounded-2xl shadow-lg px-8 ${!isArchitect ? "liquid-metal-button shadow-teal-200/50" : "border-slate-200"}`}
            onClick={handleManagePlan}
            disabled={loadingPortal}
            type="button"
          >
            {loadingPortal ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : isArchitect ? (
              "Manage Plan"
            ) : (
              "Upgrade Now"
            )}
          </Button>
        </div>

        <div className="px-2">
          {!isArchitect ? (
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Architect is{" "}
              <span className="text-slate-900 font-bold">
                ${PRICING.architectUsdPerMonth}/mo
              </span>{" "}
              with{" "}
              <span className="text-slate-900 font-bold">
                professional AI generation
              </span>
              , 10 smart document scans per month, and priority project
              strategy. Project Pass is ${PRICING.projectPassUsdOneTime}{" "}
              one-time per project.
            </p>
          ) : (
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {subscriptionRow &&
              architectBillingChannel(subscriptionRow) === "stripe"
                ? "You have full access to professional renovation tools. Billing and invoices are handled securely through Stripe."
                : subscriptionRow &&
                    architectBillingChannel(subscriptionRow) === "store"
                  ? "You have full access to professional tools. This subscription is billed through the App Store (iOS) — manage or cancel there."
                  : "You have full access to professional renovation tools. Manage billing wherever you subscribed (Stripe on the web, or the App Store on iOS)."}
            </p>
          )}
          <p className="text-xs text-slate-500 leading-relaxed font-medium border-t border-slate-100 pt-4 mt-2">
            Plans on the website are billed through Stripe. If you subscribe in
            the iOS app, manage or cancel in the App Store — use the same place
            you subscribed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
