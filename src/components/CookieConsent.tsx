import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, X, Shield, Settings2, Check, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "bluprnt_cookie_consent_v1";

type ConsentStatus = "accepted" | "declined" | "custom" | null;

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Custom settings state
  const [settings, setSettings] = useState({
    essential: true, // Always true
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const checkConsent = () => {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Delay appearance for better UX
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    };
    checkConsent();
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleDeclineAll = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      ...settings,
      timestamp: new Date().toISOString()
    }));
    setShowModal(false);
    setIsVisible(false);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && !showModal && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-50 pointer-events-none flex justify-center lg:justify-start"
          >
            <Card className="w-full max-w-lg glass-panel pointer-events-auto border-slate-200/50 shadow-2xl overflow-hidden rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">Privacy Preferences</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        We use cookies to personalize your experience and analyze our traffic. 
                        By clicking "Accept All", you consent to our use of cookies.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="rounded-xl px-6 h-10 font-bold"
                        onClick={handleAcceptAll}
                      >
                        Accept All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl px-5 h-10 font-bold bg-white/50"
                        onClick={() => setShowModal(true)}
                      >
                        Settings
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl h-10 text-slate-500 hover:text-slate-900 underline underline-offset-4"
                        onClick={handleDeclineAll}
                      >
                        Reject Optional
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cookie Settings</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-slate-100"
                  onClick={() => setShowModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="px-8 pb-8 space-y-6">
                <div className="space-y-4">
                  {/* Essential */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Essential</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Required</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>

                  {/* Analytics */}
                  <button 
                    onClick={() => setSettings(s => ({ ...s, analytics: !s.analytics }))}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      settings.analytics ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        settings.analytics ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Analytics</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Usage & performance</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-colors duration-300",
                      settings.analytics ? "bg-slate-900" : "bg-slate-200"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300",
                        settings.analytics ? "left-6" : "left-1"
                      )} />
                    </div>
                  </button>

                  {/* Marketing */}
                  <button 
                    onClick={() => setSettings(s => ({ ...s, marketing: !s.marketing }))}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      settings.marketing ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        settings.marketing ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        <Settings2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Marketing</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recommendations</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-colors duration-300",
                      settings.marketing ? "bg-slate-900" : "bg-slate-200"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300",
                        settings.marketing ? "left-6" : "left-1"
                      )} />
                    </div>
                  </button>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    variant="primary" 
                    className="w-full h-12 rounded-2xl font-bold"
                    onClick={handleSaveCustom}
                  >
                    Save Preferences
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-500 font-bold"
                    onClick={() => setShowModal(false)}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
