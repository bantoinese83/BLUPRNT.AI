import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type UpgradeOpenReason = "general" | "invoice_limit";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimatedAmount?: number | null;
  projectId?: string | null;
  openReason?: UpgradeOpenReason;
  showDiscount?: boolean;
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
}: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<"architect" | "pass" | null>(
    null,
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setCheckoutError(null);
  }, [isOpen]);

  const mid =
    estimatedAmount != null && Number.isFinite(estimatedAmount)
      ? estimatedAmount
      : 28000;

  const handleUpgrade = async (plan: "architect" | "pass") => {
    setCheckoutError(null);
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
      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: {
            priceId: priceId.trim(),
            projectId: plan === "pass" ? projectId : undefined,
          },
        },
      );

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <button
              onClick={onClose}
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
              {showDiscount && (
                <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 shadow-sm shadow-slate-200">
                  <span className="animate-pulse">✨</span> Promo Active:
                  BLUEPRINT35
                </div>
              )}

              {openReason === "invoice_limit" && (
                <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 max-w-xl mx-auto text-left leading-relaxed">
                  You&apos;ve used all <strong>3 free invoices</strong> on this
                  project. Upgrade to add more invoices anytime.{" "}
                  <span className="text-slate-600">
                    Quotes, warranties, and permits don&apos;t count toward that
                    limit—you can still upload those for free.
                  </span>
                </p>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Protect your {formatEstimate(mid)} investment
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
                    at risk. BLUPRNT.AI helps you stay on track for less than
                    the cost of one takeout.
                  </>
                )}
              </p>
            </div>

            <div className="p-6 sm:p-10 bg-slate-50 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Door A */}
                <Card className="border-slate-200 shadow-md shadow-slate-100/50 relative overflow-hidden flex flex-col">
                  {showDiscount && (
                    <div className="absolute top-3 right-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded animate-bounce">
                      -35%
                    </div>
                  )}

                  <div className="absolute top-0 inset-x-0 h-1 bg-slate-900"></div>

                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">
                      Architect
                    </CardTitle>

                    <div className="mt-2 flex items-baseline text-slate-900">
                      {showDiscount ? (
                        <>
                          <span className="text-4xl font-bold tracking-tight">
                            $7.80
                          </span>
                          <span className="text-slate-400 line-through text-lg ml-2">
                            $12
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold tracking-tight">
                          $12
                        </span>
                      )}
                      <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <ul className="space-y-3">
                      {[
                        "Expert AI Insights & Project Strategy",
                        "Up to 10 smart invoice uploads per billing period",
                        "Track up to 2 active projects",
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
                      disabled={loadingPlan !== null || !ARCHITECT_PRICE_ID}
                      onClick={() => handleUpgrade("architect")}
                    >
                      {loadingPlan === "architect" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        "Start Architect plan"
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Door B */}
                <Card className="border-slate-200 shadow-sm flex flex-col">
                  {showDiscount && (
                    <div className="absolute top-3 right-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded animate-bounce">
                      -35%
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">
                      Project Pass
                    </CardTitle>
                    <div className="mt-2 flex items-baseline text-slate-900">
                      {showDiscount ? (
                        <>
                          <span className="text-4xl font-bold tracking-tight">
                            $31.85
                          </span>
                          <span className="text-slate-400 line-through text-lg ml-2">
                            $49
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold tracking-tight">
                          $49
                        </span>
                      )}
                      <span className="text-slate-500 ml-1">/project</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <ul className="space-y-3">
                      {[
                        "6 months of Architect features",
                        "Unlimited invoices (this project)",
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
                        loadingPlan !== null || !PASS_PRICE_ID || !projectId
                      }
                      onClick={() => handleUpgrade("pass")}
                    >
                      {loadingPlan === "pass" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        "Get Project Pass"
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="mt-8 text-center space-y-3">
                <div className="inline-block px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-900">
                    Which should I pick?
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    One big remodel?{" "}
                    <span className="font-semibold text-slate-700">
                      Project Pass
                    </span>
                    . Ongoing maintenance?{" "}
                    <span className="font-semibold text-slate-700">
                      Architect
                    </span>
                    .
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
                    onClick={onClose}
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
