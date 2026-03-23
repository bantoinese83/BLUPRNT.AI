import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Lock,
  LogIn,
  Mail,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { setDashboardWelcomeFlag } from "@/lib/dashboard-welcome";

type Mode = "signup" | "signin";

export function SignupScreen() {
  const navigate = useNavigate();
  const { persistProjectAfterSignup, persistProjectAfterSignIn } = useOnboarding();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMessage(null);
    setLoading(true);
    const persist = mode === "signup" ? persistProjectAfterSignup : persistProjectAfterSignIn;
    const result = await persist({ email, password });
    setLoading(false);
    if (result.ok) {
      let redirect = "/dashboard";
      try {
        const stored = sessionStorage.getItem("blueprintai_redirect");
        if (stored) {
          sessionStorage.removeItem("blueprintai_redirect");
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
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden ring-8 ring-white">
            <img src="/logo.png" alt="BlueprintAI Logo" className="w-10 h-10 object-contain" />
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

        <div className="space-y-4 pt-4">
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            disabled={loading || password.length < 6}
            type="button"
            onClick={handleSubmit}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            ) : mode === "signup" ? (
              <UserPlus className="w-5 h-5 shrink-0" aria-hidden />
            ) : (
              <LogIn className="w-5 h-5 shrink-0" aria-hidden />
            )}
            {loading
              ? mode === "signup"
                ? "Creating your account…"
                : "Signing in…"
              : mode === "signup"
                ? "Create free account"
                : "Sign in and save project"}
          </Button>
          {mode === "signup" ? (
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                className="text-indigo-600 font-medium hover:underline"
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
                className="text-indigo-600 font-medium hover:underline"
                onClick={() => setMode("signup")}
              >
                Create an account
              </button>
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
