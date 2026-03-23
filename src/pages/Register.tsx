import { useState } from "react";
import { Helmet } from "react-helmet-async";

import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  MapPin,
  UserPlus,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";

type Mode = "password" | "magic";

export default function Register() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Sign-up isn't available right now. Please try again later.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }

    setLoading(true);
    try {
      const { data: auth, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message || "Couldn’t create your account.");
        return;
      }

      let session = auth.session;
      if (!session && auth.user) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        session = signInData.session;
      }
      if (!session?.user) {
        setError(
          "Check your email to confirm your account, then sign in. Or turn off “Confirm email” in Supabase (Auth → Email) for instant access.",
        );
        return;
      }

      const userId = session.user.id;
      const postal = zip.replace(/\D/g, "").slice(0, 5) || "00000";

      const { data: prop, error: pErr } = await supabase
        .from("properties")
        .insert({
          owner_user_id: userId,
          postal_code: postal,
          city: "",
          state: "",
          country: "US",
        })
        .select("id")
        .single();

      if (pErr || !prop) {
        setError(
          "Account created, but we couldn’t set up your property. Try signing in from the login page.",
        );
        return;
      }

      const { data: proj, error: jErr } = await supabase
        .from("projects")
        .insert({
          property_id: prop.id,
          name: "My home project",
          type: "other",
          stage: "planning",
        })
        .select("id")
        .single();

      if (jErr || !proj) {
        setError("Account created. Sign in and add a project from the dashboard.");
        return;
      }

      try {
        localStorage.setItem("bluprnt_project_id", proj.id);
      } catch {
        /* ignore */
      }
      navigate("/dashboard", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLinkSignup() {
    setError(null);
    setMagicSent(false);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Sign-up isn't available right now. Please try again later.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        shouldCreateUser: true,
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
    <>
      <Helmet>
        <title>Create Free Account — BLUPRNT.AI</title>
        <meta name="description" content="Start your renovation financial plan. Track costs, manage invoices, and build a property ledger for your home." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4 py-12">

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 shadow-xl shadow-slate-100/50 ring-8 ring-white border border-slate-100 overflow-hidden sm:h-28 sm:w-28 sm:rounded-3xl sm:p-2.5">
            <img src="/bluprnt_logo.svg" alt="BLUPRNT logo" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Create your free account</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Google, magic link, or password — then start tracking projects.
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

        {error && (
          <p
            className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
            <span>{error}</span>
          </p>
        )}

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="reg-email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="reg-zip">
                ZIP code <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                <Input
                  id="reg-zip"
                  inputMode="numeric"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="h-12 pl-10"
                  autoComplete="postal-code"
                  placeholder="For regional cost defaults"
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
                <UserPlus className="w-5 h-5 shrink-0" aria-hidden />
              )}
              {loading ? "Creating account…" : "Create free account"}
            </Button>
          </form>
        ) : magicSent ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 space-y-2">
            <p className="font-semibold flex items-center gap-2 text-slate-950">
              <Mail className="w-5 h-5 shrink-0" aria-hidden />
              Check your inbox
            </p>
            <p>
              We sent a link to <strong>{email.trim()}</strong>. Open it to finish setting up your account.
            </p>
            <button
              type="button"
              className="text-slate-900 font-bold hover:underline text-sm"
              onClick={() => setMagicSent(false)}
            >
              Use a different email
            </button>
          </div>

        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="reg-magic-email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                <Input
                  id="reg-magic-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs text-slate-500">
                No password — we’ll email you a secure link. You’ll land in the app right after.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              variant="primary"
              className="w-full"
              disabled={loading}
              onClick={sendMagicLinkSignup}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
              ) : (
                <Wand2 className="w-5 h-5 shrink-0" aria-hidden />
              )}
              {loading ? "Sending…" : "Email me a signup link"}
            </Button>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-50 px-3 text-slate-500">Already have an account?</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full gap-2 border-slate-200"
          onClick={() => navigate("/login")}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shadow-sm border border-slate-100 overflow-hidden shrink-0">
            <img src="/bluprnt_logo.svg" alt="BLUPRNT logo" className="h-full w-full object-contain" />
          </div>
          Sign in instead
        </Button>

        <p className="text-center text-sm text-slate-500">
          Want an estimate first?{" "}
          <Link to="/onboarding" className="text-slate-900 font-bold hover:underline">
            Start onboarding
          </Link>

        </p>
      </div>
    </div>
    </>
  );
}

