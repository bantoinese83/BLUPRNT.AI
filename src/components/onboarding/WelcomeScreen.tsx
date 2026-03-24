import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  LogIn,
  UserPlus,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasProjects, setHasProjects] = useState(false);
  const loggedIn = !!user;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured() || !user) {
        queueMicrotask(() => setChecking(false));
        return;
      }
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1);
      const pid = props?.[0]?.id;
      if (!pid) {
        if (!cancelled) queueMicrotask(() => setChecking(false));
        return;
      }
      const { count } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("property_id", pid);
      if (!cancelled) {
        queueMicrotask(() => {
          setHasProjects((count ?? 0) > 0);
          setChecking(false);
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (checking) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-sm">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <div className="h-6 w-6 border-2 border-slate-200 border-t-indigo-600 rounded-full" />
          </motion.div>
          Checking your account…
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col items-center text-center space-y-8 py-4 sm:py-10">
        <div className="space-y-4 max-w-sm">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
          >
            <span className="liquid-metal-text leading-[1.1] block">
              Transform your renovation
            </span>
            <span className="text-indigo-600">into a financial plan</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-slate-500 leading-relaxed px-4 font-medium"
          >
            Get real-world costs, track invoices, and build a project record you
            can hand to future buyers.
          </motion.p>
        </div>

        {loggedIn && hasProjects ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full space-y-3 pt-4"
          >
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Saved progress detected
            </p>
            <Button
              size="lg"
              variant="primary"
              className="w-full gap-2 group h-14 text-base"
              onClick={() => navigate("/dashboard")}
              type="button"
            >
              <LayoutDashboard
                className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110"
                aria-hidden
              />
              Continue to Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 border-slate-200 h-14 text-base bg-white/50 backdrop-blur-sm"
              onClick={() => navigate("/onboarding/type")}
              type="button"
            >
              <PlusCircle className="w-5 h-5 shrink-0" aria-hidden />
              Start another estimate
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full text-slate-400 gap-2 font-medium"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/onboarding", { replace: true });
                window.location.reload();
              }}
              type="button"
            >
              Sign in to a different account
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full space-y-4 pt-6 px-2"
          >
            <Button
              size="lg"
              variant="primary"
              className="w-full h-14 text-base shadow-xl shadow-indigo-500/20 group"
              onClick={() => navigate("/onboarding/type")}
              type="button"
            >
              Get my first estimate
              <ArrowRight
                className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Button>

            <div className="relative py-2">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="bg-white px-4 text-slate-300">Or</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 rounded-xl text-sm font-bold h-12 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 text-sm font-bold text-slate-600 border border-transparent hover:border-slate-100"
                onClick={() => navigate("/login")}
                type="button"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign in
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
