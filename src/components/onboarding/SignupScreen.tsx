import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Lock,
  LogIn,
  Mail,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { setDashboardWelcomeFlag } from "@/lib/dashboard-welcome";
import { supabase } from "@/lib/supabase";

type Mode = "signup" | "signin" | "authenticated";

export function SignupScreen() {
  const navigate = useNavigate();
  const { persistProjectAfterSignup, persistProjectAfterSignIn, persistProject } = useOnboarding();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setMode("authenticated");
        setUserEmail(data.session.user.email ?? "your account");
      }
    });
  }, []);

  const handleSubmit = async () => {
    setMessage(null);
    setLoading(true);
    
    let result;
    if (mode === "authenticated") {
      result = await persistProject();
    } else {
      const persist = mode === "signup" ? persistProjectAfterSignup : persistProjectAfterSignIn;
      result = await persist({ email, password });
    }

    setLoading(false);
    if (result.ok) {
      let redirect = "/dashboard";
      try {
        const stored = sessionStorage.getItem("bluprnt_redirect");
        if (stored) {
          sessionStorage.removeItem("bluprnt_redirect");
          redirect = getSafeRedirect(stored);
        }
      } catch {
        /* ignore */
      }
      if (mode === "signup") {
        setDashboardWelcomeFlag();
      }
      navigate(redirect, { replace: true });
      return;
    }
    setMessage(result.message);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 shadow-xl shadow-slate-100/50 ring-8 ring-white border border-slate-100 overflow-hidden sm:h-28 sm:w-28 sm:rounded-3xl sm:p-2.5">
            <img src="/bluprnt_logo.svg" alt="BLUPRNT logo" className="h-full w-full object-contain" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Save this project and track quotes
            </h2>
            <p className="text-slate-500">
              We&apos;ll keep your estimate, photos, and changes in one place — part of your home&apos;s long-term financial record.
            </p>
          </div>
        </div>

        {mode !== "authenticated" && (
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-100/80">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => {
                setMode("signup");
                setMessage(null);
              }}
            >
              <UserPlus className="w-4 h-4" aria-hidden />
              Create account
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => {
                setMode("signin");
                setMessage(null);
              }}
            >
              <LogIn className="w-4 h-4" aria-hidden />
              Sign in
            </button>
          </div>
        )}

        {mode !== "authenticated" && (
          <div className="space-y-4">
            {message && (
              <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" aria-hidden />
                <span>{message}</span>
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="signup-email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  className="h-12 pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            disabled={loading || (mode !== "authenticated" && mode === "signup" && password.length < 6) || (mode === "signin" && password.length < 1)}
            type="button"
            onClick={handleSubmit}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            ) : mode === "authenticated" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden />
            ) : mode === "signup" ? (
              <UserPlus className="w-5 h-5 shrink-0" aria-hidden />
            ) : (
              <LogIn className="w-5 h-5 shrink-0" aria-hidden />
            )}
            {loading
               ? mode === "authenticated"
                ? "Saving to your account…"
                : mode === "signup"
                ? "Creating your account…"
                : "Signing in…"
              : mode === "authenticated"
                ? "Save to my account"
              : mode === "signup"
                ? "Create free account"
                : "Sign in and save project"}
          </Button>

          {mode === "authenticated" && (
            <p className="text-center text-xs text-slate-500 italic pb-2">
              Signed in as <span className="font-bold text-slate-700">{userEmail}</span>
            </p>
          )}

          {mode !== "authenticated" && (
            <>
              {mode === "signup" ? (
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-slate-900 font-bold hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    Sign in to save your project
                  </button>
                </p>
              ) : (
                <p className="text-center text-sm text-slate-500">
                  New to BlueprintAI?{" "}
                  <button
                    type="button"
                    className="text-slate-900 font-bold hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Create an account
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

