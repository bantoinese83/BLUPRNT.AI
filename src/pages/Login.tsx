import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Home,
  Loader2,
  Lock,
  LogIn,
  Mail,
  UserPlus,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";

type Mode = "password" | "magic";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const urlErrorParam = searchParams.get("error");
  const urlError = urlErrorParam ? decodeURIComponent(urlErrorParam) : null;
  const displayError = error || urlError;

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Sign-in isn't available right now. Please try again later.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Couldn’t sign in. Check your details.");
      return;
    }
    const redirectTo = getSafeRedirect(searchParams.get("redirect"));
    navigate(redirectTo, { replace: true });
  }

  async function sendMagicLink() {
    setError(null);
    setMagicSent(false);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Sign-in isn't available right now. Please try again later.");
      return;
    }
    const redirectTo = searchParams.get("redirect");
    if (redirectTo) {
      try {
        sessionStorage.setItem("blueprintai_auth_redirect", redirectTo);
      } catch {
        /* ignore */
      }
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        shouldCreateUser: false,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Couldn’t send the link. Try again.");
      return;
    }
    setMagicSent(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden ring-8 ring-white">
            <img src="/logo.png" alt="BlueprintAI Logo" className="w-10 h-10 object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm">
              Sign in with Google, a magic link, or password.
            </p>
          </div>
        </div>

        <AuthSocialButtons
          onError={setError}
          googleLoading={googleLoading}
          setGoogleLoading={setGoogleLoading}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-50 px-3 text-slate-500">Or use email</span>
          </div>
        </div>

        <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-100/80">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              mode === "password"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => {
              setMode("password");
              setError(null);
              setMagicSent(false);
            }}
          >
            <Lock className="w-4 h-4" aria-hidden />
            Password
          </button>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              mode === "magic"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => {
              setMode("magic");
              setError(null);
              setMagicSent(false);
            }}
          >
            <Wand2 className="w-4 h-4" aria-hidden />
            Magic link
          </button>
        </div>

        {displayError && (
          <p
            className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
            <span>{displayError}</span>
          </p>
        )}

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="login-email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
              ) : (
                <LogIn className="w-5 h-5 shrink-0" aria-hidden />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {magicSent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <Mail className="w-5 h-5 shrink-0" aria-hidden />
                  Check your inbox
                </p>
                <p>
                  We sent a sign-in link to <strong>{email.trim()}</strong>. Open it on this device to continue.
                </p>
                <button
                  type="button"
                  className="text-indigo-600 font-medium hover:underline text-sm"
                  onClick={() => setMagicSent(false)}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="magic-email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                    <Input
                      id="magic-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-10"
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    We’ll email you a one-tap link. For new accounts, use{" "}
                    <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                      Create account
                    </Link>
                    .
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  variant="primary"
              className="w-full"
                  disabled={loading}
                  onClick={sendMagicLink}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                  ) : (
                    <Wand2 className="w-5 h-5 shrink-0" aria-hidden />
                  )}
                  {loading ? "Sending…" : "Email me a magic link"}
                </Button>
              </>
            )}
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-50 px-3 text-slate-500">New to BlueprintAI?</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2 border-indigo-200 bg-indigo-50/50 text-indigo-900 hover:bg-indigo-50"
            onClick={() => navigate("/register")}
          >
            <UserPlus className="w-5 h-5 shrink-0" aria-hidden />
            Create free account
          </Button>
          <p className="text-center text-sm text-slate-500">
            Or{" "}
            <Link to="/onboarding" className="text-indigo-600 font-medium hover:underline">
              get an estimate first
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
