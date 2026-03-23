import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";

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

export function UpgradeModal({ isOpen, onClose, estimatedAmount, projectId, openReason = "general", showDiscount = false }: UpgradeModalProps) {
  const mid = estimatedAmount != null && Number.isFinite(estimatedAmount)
    ? estimatedAmount
    : 28000;
  const architectUrl = import.meta.env.VITE_STRIPE_ARCHITECT_URL;
  const baseProjectPassUrl = import.meta.env.VITE_STRIPE_PROJECT_PASS_URL;
  const projectPassUrl = baseProjectPassUrl && projectId
    ? `${baseProjectPassUrl}${baseProjectPassUrl.includes("?") ? "&" : "?"}project_id=${projectId}`
    : baseProjectPassUrl;
  const hasStripe = Boolean(architectUrl || baseProjectPassUrl);

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
            
            <div className={`p-6 sm:p-10 text-center space-y-4 border-b border-slate-100 ${showDiscount ? 'bg-indigo-50/50' : ''}`}>
              {showDiscount && (
                <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 shadow-sm shadow-indigo-100">
                  <span className="animate-pulse">✨</span> Promo Active: BLUEPRINT35
                </div>
              )}
              {openReason === "invoice_limit" && (
                <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 max-w-xl mx-auto text-left leading-relaxed">
                  You&apos;ve used all <strong>3 free invoices</strong> on this project. Upgrade to add more invoices anytime.{" "}
                  <span className="text-slate-600">
                    Quotes, warranties, and permits don&apos;t count toward that limit—you can still upload those for free.
                  </span>
                </p>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Protect your {formatEstimate(mid)} investment
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto text-base leading-relaxed">
                {mid >= 50000
                  ? "Projects over $50k tend to run 10–20% over budget. Turn on advanced protections to stay on track."
                  : mid >= 15000
                    ? "Projects over $15k often run over budget. BlueprintAI helps you stay on track for less than the cost of one takeout."
                    : (
                        <>
                          Renovations often run 10–20% over budget. That&apos;s{" "}
                          <span className="font-semibold text-slate-900">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(mid * 0.15)}–{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(mid * 0.2)}
                          </span>
                          {" "}at risk. BlueprintAI helps you stay on track for less than the cost of one takeout.
                        </>
                      )}
              </p>
            </div>

            <div className="p-6 sm:p-10 bg-slate-50 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Door A */}
                <Card className="border-indigo-200 shadow-md shadow-indigo-100/50 relative overflow-hidden flex flex-col">
                  {showDiscount && (
                    <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded animate-bounce">
                      -35%
                    </div>
                  )}
                  <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600"></div>
                  <CardHeader>
                    <CardTitle className="text-xl text-indigo-900">Architect</CardTitle>
                    <div className="mt-2 flex items-baseline text-slate-900">
                      {showDiscount ? (
                        <>
                          <span className="text-4xl font-bold tracking-tight">$7.80</span>
                          <span className="text-slate-400 line-through text-lg ml-2">$12</span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold tracking-tight">$12</span>
                      )}
                      <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <ul className="space-y-3">
                      {["Unlimited estimates & photo analysis", "Track up to 2 active projects", "Invoice OCR (10 uploads/month)", "Seller Packet PDF for your property"].map((item, i) => (
                        <li key={i} className="flex items-start space-x-3 text-sm text-slate-700">
                          <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0 mt-auto">
                    <Button
                      variant="primary"
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        if (architectUrl) window.location.href = architectUrl;
                        else if (!hasStripe) onClose();
                      }}
                    >
                      {architectUrl ? "Start Architect plan" : "Coming soon"}
                    </Button>
                  </div>
                </Card>

                {/* Door B */}
                <Card className="border-slate-200 shadow-sm flex flex-col">
                  {showDiscount && (
                    <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded animate-bounce">
                      -35%
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">Project Pass</CardTitle>
                    <div className="mt-2 flex items-baseline text-slate-900">
                      {showDiscount ? (
                        <>
                          <span className="text-4xl font-bold tracking-tight">$31.85</span>
                          <span className="text-slate-400 line-through text-lg ml-2">$49</span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold tracking-tight">$49</span>
                      )}
                      <span className="text-slate-500 ml-1">/project</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <ul className="space-y-3">
                      {["6 months of Architect features", "Locked to this project – no subscription", "Perfect for one big remodel"].map((item, i) => (
                        <li key={i} className="flex items-start space-x-3 text-sm text-slate-700">
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
                      onClick={() => {
                        if (projectPassUrl) window.location.href = projectPassUrl;
                        else if (!hasStripe) onClose();
                      }}
                    >
                      {projectPassUrl ? "Get Project Pass" : "Coming soon"}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="mt-8 text-center space-y-2">
                <p className="text-sm text-slate-500">
                  Most users with projects over $15,000 choose Architect or a Project Pass.
                </p>
                <button className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors" onClick={onClose}>
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
