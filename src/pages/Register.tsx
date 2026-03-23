import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  Loader2,
  Lock,
  LogIn,
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
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

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
    } catch {
      setError("Sign-up failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setError(null);
    setMagicSent(false);
    if (!email.trim() || !zip.trim()) {
      setError("Email and ZIP are required.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Sign-in isn't available right now. Please try again later.");
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
        <title>Create account — BLUPRNT.AI</title>
        <meta name="description" content="Start your property journey by creating a free account. Get instant estimates and track your renovation." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center mb-4">
            <Breadcrumbs className="bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-100 shadow-sm" />
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 shadow-xl shadow-slate-100/50 ring-8 ring-white border border-slate-100 overflow-hidden sm:h-28 sm:w-28 sm:rounded-3xl sm:p-2.5">
              <img src="/bluprnt_logo.svg" alt="BLUPRNT logo" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
              <p className="text-slate-500 text-sm">
                Get your blueprint for a smarter home renovation.
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
                <label className="text-sm font-medium text-slate-700" htmlFor="register-email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    id="register-email"
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
                <label className="text-sm font-medium text-slate-700" htmlFor="register-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10"
                    required
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="register-zip">
                  Property ZIP Code
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    id="register-zip"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                    className="h-12 pl-10"
                    required
                    placeholder="For local pricing"
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
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {magicSent ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 space-y-2">
                  <p className="font-semibold flex items-center gap-2 text-slate-950">
                    <Mail className="w-5 h-5 shrink-0" aria-hidden />
                    Check your inbox
                  </p>
                  <p>
                    We sent a sign-in link to <strong>{email.trim()}</strong>. Open it on this device to create your account.
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
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="magic-email">
                      Email address
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
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="magic-zip">
                      Property ZIP Code
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                      <Input
                        id="magic-zip"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={5}
                        value={zip}
                        onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                        className="h-12 pl-10"
                        required
                        placeholder="For local pricing"
                      />
                    </div>
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
              <span className="bg-slate-50 px-3 text-slate-500">Already a user?</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
              onClick={() => navigate("/login")}
            >
              <LogIn className="w-5 h-5 shrink-0" aria-hidden />
              Sign in to account
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
