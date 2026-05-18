import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { invokeFunction } from "@/lib/supabase";
import { PRICING } from "@shared/constants/pricing";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing.js";
import {
  ArchitectPlanIcon,
  ProjectPassIcon,
} from "@/components/icons/PlanMarks";
import { FREE_TIER_BILL_RECEIPT_LIMIT } from "@shared/lib/ledger-entry-quota";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import { architectBillingChannel } from "@shared/lib/subscription-billing";
import {
  MARKETING_DISCOUNT_PROMO_CODE,
  MARKETING_DISCOUNT_SESSION_KEY,
} from "@shared/constants/marketing-discount";
import type { UserSubscriptionRow } from "@shared/types/database";

const ARCHITECT_LEDGER_LIMIT = 10;

export type UpgradeOpenReason = "general" | "ledger_limit" | "export";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimatedAmount?: number | null;
  projectId?: string | null;
  openReason?: UpgradeOpenReason;
  showDiscount?: boolean;
  /** Subscription row — preferred source for Architect entitlement in this modal. */
  subscription?: UserSubscriptionRow | null;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
}

function formatEstimate(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "your project";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const ARCHITECT_PRICE_ID = import.meta.env.VITE_STRIPE_ARCHITECT_PRICE_ID as
  | string
  | undefined;
const PASS_PRICE_ID = import.meta.env.VITE_STRIPE_PROJECT_PASS_PRICE_ID as
  | string
  | undefined;

export function UpgradeModal({
  isOpen,
  onClose,
  estimatedAmount,
  projectId,
  openReason = "general",
  showDiscount = false,
  subscription = null,
  isArchitect = false,
  hasProjectPass = false,
}: UpgradeModalProps) {
  const architectEntitled =
    isArchitectPlanEffective(subscription) || isArchitect;
  const canManageArchitectInStripe =
    architectEntitled &&
    subscription != null &&
    architectBillingChannel(subscription) === "stripe";
  const [loadingPlan, setLoadingPlan] = useState<
    "architect" | "pass" | "portal" | null
  >(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setCheckoutError(null);
  }, [isOpen]);

  const mid =
    estimatedAmount != null &&
    Number.isFinite(estimatedAmount) &&
    estimatedAmount > 0
      ? estimatedAmount
      : 28000;

  const shouldApplyPromo =
    showDiscount ||
    (typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(MARKETING_DISCOUNT_SESSION_KEY) === "true");

  const handleUpgrade = async (plan: "architect" | "pass") => {
    setCheckoutError(null);
    if (plan === "architect" && architectEntitled) {
      return;
    }
    const priceId = plan === "architect" ? ARCHITECT_PRICE_ID : PASS_PRICE_ID;
    if (!priceId?.trim()) {
      setCheckoutError(
        "Checkout isn’t set up yet. Add Stripe price IDs in your environment and try again.",
      );
      return;
    }
    if (plan === "pass" && !projectId) {
      setCheckoutError(
        "Open a project first, then try the Project Pass again.",
      );
      return;
    }
    setLoadingPlan(plan);
    try {
      const { data, error } = await invokeFunction<{
        url?: string;
        error?: string;
      }>(EDGE_FUNCTIONS.CREATE_CHECKOUT, {
        body: {
          priceId: priceId.trim(),
          projectId: plan === "pass" ? projectId : undefined,
          applyPromoCode: shouldApplyPromo,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError("We couldn’t start checkout. Please try again.");
    } catch (err) {
      console.error("Stripe Checkout error:", err);
      setCheckoutError("Something went wrong with checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManagePortal = async () => {
    setLoadingPlan("portal");
    try {
      const { data, error } = await invokeFunction<{ url: string }>(
        EDGE_FUNCTIONS.CREATE_PORTAL_SESSION,
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
      setCheckoutError("Couldn't open billing portal. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <ModalDialog
      open={isOpen}
      onClose={onClose}
      titleId="upgrade-modal-title"
      zClassName="z-50"
      panelClassName="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-10"
      >
        <X className="w-4 h-4" />
      </button>

      <div
        className={`p-6 sm:p-10 text-center space-y-4 border-b border-slate-100 ${showDiscount ? "bg-slate-50/50" : ""}`}
      >
        {checkoutError && (
          <p
            className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl px-4 py-3 max-w-xl mx-auto text-left"
            role="alert"
          >
            {checkoutError}
          </p>
        )}
        {openReason === "ledger_limit" && (
          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            Only <strong>vendor invoices</strong> and{" "}
            <strong>store receipts</strong> count toward this cap. Quotes,
            estimates, permits, and other records don&apos;t.
          </p>
        )}
        {shouldApplyPromo && (
          <p className="text-sm text-teal-900 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 max-w-xl mx-auto leading-relaxed">
            Your <strong>{MARKETING_DISCOUNT_PROMO_CODE}</strong> discount
            applies automatically at checkout when available. List prices:{" "}
            <strong>${PRICING.architectUsdPerMonth}/mo</strong> Architect tier,{" "}
            <strong>${PRICING.projectPassUsdOneTime}</strong> Project Pass.
          </p>
        )}

        {openReason === "ledger_limit" && architectEntitled && (
          <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 max-w-xl mx-auto text-left leading-relaxed">
            You&apos;ve used your{" "}
            <strong>{ARCHITECT_LEDGER_LIMIT} bill or receipt uploads</strong>{" "}
            for this billing period. Your limit will reset when your
            subscription renews.{" "}
            <span className="text-slate-600">
              Quotes, permits, and other record types don&apos;t count.
            </span>
          </p>
        )}
        {openReason === "ledger_limit" && hasProjectPass && (
          <p className="text-sm text-slate-700 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 max-w-xl mx-auto text-left leading-relaxed">
            Your <strong>Project Pass</strong> includes unlimited bill and
            receipt uploads for this project while your pass is active.
          </p>
        )}
        {openReason === "ledger_limit" &&
          !architectEntitled &&
          !hasProjectPass && (
            <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 max-w-xl mx-auto text-left leading-relaxed">
              You&apos;ve used all{" "}
              <strong>
                {FREE_TIER_BILL_RECEIPT_LIMIT} free bill or receipt
              </strong>{" "}
              uploads on this project. Upgrade to add more anytime.{" "}
              <span className="text-slate-600">
                Quotes, estimates, permits, and other records don&apos;t use
                that cap.
              </span>
            </p>
          )}
        {openReason === "export" && !architectEntitled && !hasProjectPass && (
          <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 max-w-xl mx-auto text-left leading-relaxed">
            The full <strong>seller packet PDF</strong> (estimate scope, plan vs
            documented spend, and recorded costs) is included with{" "}
            <strong>Architect</strong> tier or a <strong>Project Pass</strong>.
            You can still browse your project on the free plan.
          </p>
        )}
        <h2
          id="upgrade-modal-title"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
        >
          {openReason === "ledger_limit"
            ? "Add more bills & receipts"
            : openReason === "export"
              ? "Unlock your Home Archive export"
              : `Protect your ${formatEstimate(mid)} investment`}
        </h2>
        <p className="text-slate-600 max-w-xl mx-auto text-base leading-relaxed">
          {mid >= 50000 ? (
            "Projects over $50k tend to run 10–20% over budget. Turn on advanced protections to stay on track."
          ) : mid >= 15000 ? (
            "Projects over $15k often run over budget. BLUPRNT.AI helps you stay on track for less than the cost of one takeout."
          ) : (
            <>
              Renovations often run 10–20% over budget. That&apos;s{" "}
              <span className="font-semibold text-slate-900">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(mid * 0.15)}
                –
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(mid * 0.2)}
              </span>{" "}
              at risk. BLUPRNT.AI helps you stay on track for less than the cost
              of one takeout.
            </>
          )}
        </p>
      </div>

      <div className="p-6 sm:p-10 bg-slate-50 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Door A */}
          <Card className="border-slate-200 shadow-md shadow-slate-100/50 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 inset-x-0 h-1 bg-teal-600"></div>

            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                <ArchitectPlanIcon className="h-8 w-8" title="Architect Plan" />
                Architect
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium leading-snug">
                Monthly subscription — full app access for homeowners and
                renovators.
              </p>

              <div className="mt-2 flex items-baseline text-slate-900">
                <span className="text-4xl font-bold tracking-tight">
                  ${PRICING.architectUsdPerMonth}
                </span>
                <span className="text-slate-500 ml-1">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <ul className="space-y-3">
                {[
                  "Expert AI Insights & Project Strategy",
                  `Up to ${ARCHITECT_LEDGER_LIMIT} ledger record uploads per billing period, total across all projects`,
                  "Full app access (Architect tier)",
                  "Cloud-backed Seller Packet PDF",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start space-x-3 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Button
                variant="primary"
                className="w-full premium-gradient"
                size="lg"
                disabled={
                  loadingPlan !== null ||
                  !ARCHITECT_PRICE_ID ||
                  architectEntitled
                }
                onClick={() => handleUpgrade("architect")}
              >
                {loadingPlan === "architect" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : architectEntitled ? (
                  "Current Plan"
                ) : (
                  "Subscribe to Architect"
                )}
              </Button>
            </div>
          </Card>

          {/* Door B */}
          <Card className="border-slate-200 shadow-sm flex flex-col relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                <ProjectPassIcon className="h-8 w-8" />
                Project Pass
              </CardTitle>
              <div className="mt-2 flex items-baseline text-slate-900">
                <span className="text-4xl font-bold tracking-tight">
                  ${PRICING.projectPassUsdOneTime}
                </span>
                <span className="text-slate-500 ml-1">/project</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <ul className="space-y-3">
                {[
                  "6 months of Architect features",
                  "Unlimited ledger record uploads for this project while your pass is active",
                  "No subscription – one-time payment",
                  "Perfect for one big remodel",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start space-x-3 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Button
                className="w-full"
                variant="outline"
                size="lg"
                disabled={
                  loadingPlan !== null || !PASS_PRICE_ID || hasProjectPass
                }
                onClick={() => handleUpgrade("pass")}
              >
                {loadingPlan === "pass" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : hasProjectPass ? (
                  "Current Plan"
                ) : (
                  "Get Project Pass"
                )}
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="inline-block px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-900">
              Which should I pick?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              One big remodel?{" "}
              <span className="font-semibold text-slate-700">Project Pass</span>
              . Ongoing maintenance?{" "}
              <span className="font-semibold text-slate-700">Architect</span>.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="flex items-center justify-center gap-1.5 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Secure payments via
              </span>
              <img
                src="/stripe-logo.svg"
                alt="Stripe"
                className="h-5 w-auto mb-0.5"
              />
            </div>

            {canManageArchitectInStripe && (
              <button
                type="button"
                onClick={handleManagePortal}
                disabled={loadingPlan === "portal"}
                className="text-xs text-teal-700 font-bold hover:text-teal-900 transition-colors flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full border border-teal-100"
              >
                {loadingPlan === "portal" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                Manage or cancel your Architect subscription
              </button>
            )}

            <button
              className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
              onClick={onClose}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
