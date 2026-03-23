import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, LogIn, UserPlus, LayoutDashboard, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasProjects, setHasProjects] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured()) {
        setChecking(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) {
        setChecking(false);
        return;
      }
      setLoggedIn(true);
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_user_id", session.user.id)
        .limit(1);
      const pid = props?.[0]?.id;
      if (!pid) {
        if (!cancelled) setChecking(false);
        return;
      }
      const { count } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("property_id", pid);
      if (!cancelled) {
        setHasProjects((count ?? 0) > 0);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-sm">
          Checking your account…
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col items-center text-center space-y-8 py-12">
        <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200/50 border border-slate-100 ring-8 ring-white">
          <img src="/logo.png" alt="BLUPRNT.AI Logo" className="w-14 h-14 object-contain" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Turn your renovation into a financial plan
          </h1>
          <p className="text-lg text-slate-500 max-w-sm mx-auto">
            Get real-world costs, track invoices, and build a home improvement record you can hand to buyers.
          </p>
        </div>

        {loggedIn && hasProjects ? (
          <div className="w-full space-y-3 pt-4">
            <p className="text-sm text-slate-600 font-medium">You have a saved project</p>
            <Button
              size="lg"
              variant="primary"
              className="w-full gap-2"
              onClick={() => navigate("/dashboard")}
              type="button"
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" aria-hidden />
              Continue to my dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 border-slate-200"
              onClick={() => navigate("/onboarding/type")}
              type="button"
            >
              <PlusCircle className="w-5 h-5 shrink-0" aria-hidden />
              Start another estimate
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full text-slate-500 gap-2"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/onboarding", { replace: true });
                window.location.reload();
              }}
              type="button"
            >
              <LogIn className="w-5 h-5 shrink-0" aria-hidden />
              Use a different account
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-3 pt-8">
            <Button
              size="lg"
              variant="primary"
              className="w-full"
              onClick={() => navigate("/onboarding/type")}
              type="button"
            >
              Get my first estimate
              <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
            </Button>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-bold h-12 px-8 w-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            >
              <UserPlus className="w-5 h-5 shrink-0" aria-hidden />
              Create free account
            </Link>

            <Button
              size="lg"
              variant="ghost"
              className="w-full text-slate-500 gap-2"
              onClick={() => navigate("/login")}
              type="button"
            >
              <LogIn className="w-5 h-5 shrink-0" aria-hidden />
              Sign in
            </Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
