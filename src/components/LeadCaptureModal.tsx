import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, ArrowRight, TrendingDown, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeIcon } from "@/components/ui/UpgradeIcon";

import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface LeadCaptureModalProps {
  onPlanSelect?: (plan: 'architect' | 'pass') => void;
}

export function LeadCaptureModal({ onPlanSelect }: LeadCaptureModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if we've already shown it this session
    const shown = sessionStorage.getItem("exit_intent_shown");
    if (shown) return;

    const handleMouseOut = (e: MouseEvent) => {
      // Trigger if mouse leaves top of viewport (intent to close/change tab)
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem("exit_intent_shown", "true");
      }
    };

    document.addEventListener("mouseleave", handleMouseOut);
    return () => document.removeEventListener("mouseleave", handleMouseOut);
  }, [hasShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setLoading(true);
      try {
        await supabase.from("marketing_leads").insert({
          email: email.trim().toLowerCase(),
          source: "exit_intent_modal"
        });
        setSubmitted(true);
      } catch (err) {
        console.error("Failed to capture lead:", err);
        // Still show success to the user so we don't block them
        setSubmitted(true);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={() => setIsVisible(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20"
          >
            {/* Close button */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left side: The Hook / visual */}
            <div className="md:w-5/12 bg-gradient-to-br from-slate-900 via-slate-800 to-black p-8 text-white relative flex flex-col justify-center overflow-hidden">
               {/* Decorative background elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white animate-pulse" />
                <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full border-2 border-white" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                  <UpgradeIcon className="w-3 h-3 text-amber-300" />
                  Limited Time Offer
                </div>

                
                <div className="space-y-1">
                  <h3 className="text-4xl font-black tracking-tighter leading-none">35% OFF</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Your Project Protections</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-xs font-medium text-slate-50">Cut renovation drift by 20%</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-xs font-medium text-slate-50">Legal-grade invoice verifying</p>
                  </div>
                </div>
              </div>
            </div>


            {/* Right side: Lead Capture / Upsell */}
            <div className="md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-white">
              {!submitted ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                      Don&apos;t leave your budget to chance.
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Enter your email to lock in your <span className="font-bold text-slate-700">35% discount</span>. We&apos;ll send you the code and our &quot;Budget Guard&quot; checklist for free.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="you@email.com"
                        className="pl-11 py-6 rounded-2xl border-slate-200 focus:ring-2 focus:ring-slate-900/20"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full py-6 rounded-2xl font-bold gap-2 shadow-lg shadow-slate-100 premium-gradient text-white"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Send my discount
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                  <p className="text-[10px] text-center text-slate-400 font-medium">
                    No spam. Just value. Unsubscribe any time.
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-3 text-center md:text-left">
                    <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto md:mx-0 shadow-lg">
                      <UpgradeIcon className="w-8 h-8 brightness-0 invert" />
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Code: BLUEPRINT35</h2>

                    <p className="text-slate-500 text-sm leading-relaxed">
                      Your discount is locked in. Ready to start your project with professional-grade protections?
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      variant="primary" 
                      className="w-full py-6 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white"

                      onClick={() => onPlanSelect?.('architect')}
                    >
                      Use discount for Architect Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full py-6 rounded-2xl font-bold text-slate-600"
                      onClick={() => {
                        setIsVisible(false);
                        onPlanSelect?.('pass');
                      }}
                    >
                      View Project Pass options
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
