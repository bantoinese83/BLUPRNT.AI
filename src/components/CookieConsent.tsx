import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, X, Shield, Settings2, Check, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "bluprnt_cookie_consent_v1";

type ConsentStatus = "accepted" | "declined" | "custom" | null;

export function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Custom settings state
  const [settings, setSettings] = useState({
    essential: true, // Always true
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      status: "accepted",
      timestamp: new Date().toISOString(),
      settings: { essential: true, analytics: true, marketing: true }
    }));
    setIsVisible(false);
  };

  const handleDeclineAll = () => {
     localStorage.setItem(CONSENT_KEY, JSON.stringify({
      status: "declined",
      timestamp: new Date().toISOString(),
      settings: { essential: true, analytics: false, marketing: false }
    }));
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      status: "custom",
      timestamp: new Date().toISOString(),
      settings
    }));
    setShowModal(false);
    setIsVisible(false);
  };

  if (status === "accepted" || status === "declined") return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none"
          >
            <Card className="max-w-4xl w-full glass-dark border-slate-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden pointer-events-auto">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">Your privacy, our blueprint.</h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                      We use cookies to enhance your project tracking experience, analyze site traffic, and help us improve BLUPRNT. By clicking "Accept All", you consent to our use of cookies.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl h-11 px-6 font-semibold"
                      onClick={() => setShowModal(true)}
                    >
                      Customize
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-slate-700 text-slate-200 hover:bg-slate-800 rounded-xl h-11 px-6 font-semibold"
                      onClick={handleDeclineAll}
                    >
                      Reject All
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="bg-white text-slate-950 hover:bg-slate-100 rounded-xl h-11 px-8 font-black shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                      onClick={handleAcceptAll}
                    >
                      Accept All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg glass-dark border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <Settings2 className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Cookie Settings</h3>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <CookieOption 
                    icon={<Shield className="w-5 h-5 text-emerald-400" />}
                    title="Essential Cookies"
                    desc="Required for core app functionality. Cannot be disabled."
                    checked={true}
                    disabled={true}
                  />
                  <CookieOption 
                    icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
                    title="Analytics Cookies"
                    desc="Help us understand how you use BLUPRNT to improve features."
                    checked={settings.analytics}
                    onChange={(checked) => setSettings(s => ({ ...s, analytics: checked }))}
                  />
                  <CookieOption 
                    icon={<Settings2 className="w-5 h-5 text-amber-400" />}
                    title="Marketing Cookies"
                    desc="Used to share project updates and renovation insights with you."
                    checked={settings.marketing}
                    onChange={(checked) => setSettings(s => ({ ...s, marketing: checked }))}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    variant="primary" 
                    className="w-full h-12 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl font-black text-base transition-transform active:scale-95"
                    onClick={handleSaveCustom}
                  >
                    Save Preferences
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl"
                    onClick={handleAcceptAll}
                  >
                    Accept All Cookies
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

function CookieOption({ 
  icon, 
  title, 
  desc, 
  checked, 
  disabled = false,
  onChange 
}: { 
  icon: React.ReactNode; 
  title: string; 
  desc: string; 
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div 
      className={cn(
        "flex items-start gap-4 p-5 rounded-3xl border transition-all duration-300",
        checked ? "bg-white/5 border-white/10" : "bg-transparent border-slate-800/50 opacity-60"
      )}
      onClick={() => !disabled && onChange?.(!checked)}
    >
      <div className="mt-1">{icon}</div>
      <div className="flex-1 space-y-1 cursor-pointer">
        <h4 className="font-bold text-white text-sm tracking-tight">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
      <div 
        className={cn(
          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
          checked ? "bg-white border-white" : "border-slate-700",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {checked && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
      </div>
    </div>
  );
}

