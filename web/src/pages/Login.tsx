import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Helmet } from "react-helmet-async";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  AlertCircle,
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
import { resolvePostLoginHref } from "@/lib/onboarding-post-auth-redirect";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AppSimpleHeader } from "@/components/layout/AppSimpleHeader";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { useAuth } from "@/hooks/use-auth";
import { META_ROBOTS_NOINDEX, seoAbsoluteUrl } from "@/lib/seo-meta";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";

type Mode = "password" | "magic";

type LoginFormValues = {
  email: string;
  password?: string;
};

const EMAIL_RULES = {
  required: "Enter your email address.",
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Enter a valid email address.",
  },
} as const;

export default function Login() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicRecipientEmail, setMagicRecipientEmail] = useState("");
  const { user, loading: authLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    resetField,
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    shouldUnregister: true,
  });

  useEffect(() => {
    if (!authLoading && user) {
      const redirectTo = resolvePostLoginHref(searchParams.get("redirect"));
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, navigate, searchParams]);

  const urlErrorParam = searchParams.get("error");
  let urlError: string | null = null;
  if (urlErrorParam) {
    try {
      urlError = decodeURIComponent(urlErrorParam);
    } catch {
      urlError = urlErrorParam;
    }
  }
  const displayError = error || urlError;
  const redirectParam = searchParams.get("redirect");
  const registerHref =
    redirectParam != null && redirectParam.trim() !== ""
      ? `/register?redirect=${encodeURIComponent(redirectParam)}`
      : "/register";

  const onPasswordLogin = handleSubmit(async ({ email, password }) => {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Sign-in isn't available right now. Please try again later.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password ?? "",
    });
    setLoading(false);
    if (err) {
      setError(
        friendlyAuthError(
          err.message || "",
          "status" in err ? (err as { status?: number }).status : undefined,
        ),
      );
      return;
    }
    const redirectTo = resolvePostLoginHref(searchParams.get("redirect"));
    navigate(redirectTo, { replace: true });
  });

  const onMagicRequest = handleSubmit(async ({ email }) => {
    setError(null);
    setMagicSent(false);
    if (!isSupabaseConfigured()) {
      setError("Sign-in isn't available right now. Please try again later.");
      return;
    }
    const redirectTo = searchParams.get("redirect");
    if (redirectTo) {
      try {
        sessionStorage.setItem("bluprnt_auth_redirect", redirectTo);
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
      setError(
        friendlyAuthError(
          err.message || "",
          "status" in err ? (err as { status?: number }).status : undefined,
        ),
      );
      return;
    }
    setMagicRecipientEmail(email.trim());
    setMagicSent(true);
  });

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMagicSent(false);
    setMagicRecipientEmail("");
    if (next === "magic") {
      resetField("password", { defaultValue: "" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <Helmet>
        <title>Sign in — BLUPRNT.AI</title>
        <meta
          name="description"
          content="Access your renovation financial plan, track invoices, and manage your property improvements."
        />
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
        <link rel="canonical" href={seoAbsoluteUrl(pathname)} />
      </Helmet>

      <AppSimpleHeader showHome />

      <div className="flex flex-1 flex-col items-center p-4 sm:p-6">
        <div className="w-full max-w-4xl py-2 mb-6">
          <Breadcrumbs className="px-2" />
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-slate-500 font-medium">
              Sign in to manage your renovation BLUPRNTs.
            </p>
          </div>

          <AuthSocialButtons
            onError={(msg) => setError(friendlyAuthError(msg))}
            googleLoading={googleLoading}
            setGoogleLoading={setGoogleLoading}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 px-3 font-bold uppercase tracking-widest text-slate-400">
                Or use email
              </span>
            </div>
          </div>

          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-100/80">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                mode === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => switchMode("password")}
            >
              <Lock className="w-4 h-4" aria-hidden />
              Password
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                mode === "magic"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => switchMode("magic")}
            >
              <Wand2 className="w-4 h-4" aria-hidden />
              Magic link
            </button>
          </div>

          {displayError && (
            <div
              className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-3 flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
              <span className="font-medium">{displayError}</span>
            </div>
          )}

          {mode === "password" ? (
            <form onSubmit={onPasswordLogin} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label
                  className="text-sm font-bold text-slate-700 ml-1"
                  htmlFor="login-email"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    className="h-12 pl-11 rounded-xl"
                    error={errors.email?.message}
                    {...register("email", EMAIL_RULES)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label
                    className="text-sm font-bold text-slate-700"
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <Link
                    to={
                      redirectParam != null && redirectParam.trim() !== ""
                        ? `/forgot-password?redirect=${encodeURIComponent(redirectParam)}`
                        : "/forgot-password"
                    }
                    className="text-xs font-bold text-teal-600 hover:text-teal-500 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    className="h-12 pl-11 rounded-xl"
                    error={errors.password?.message}
                    {...register("password", {
                      required: "Enter your password.",
                    })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                variant="primary"
                className="w-full h-14 font-black text-base shadow-xl shadow-teal-500/10"
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
                <div className="rounded-2xl border border-teal-100 bg-teal-50/30 px-5 py-5 text-sm text-slate-900 space-y-3">
                  <p className="font-black flex items-center gap-2 text-teal-900 uppercase tracking-wider text-xs">
                    <Mail className="w-4 h-4 shrink-0" aria-hidden />
                    Check your inbox
                  </p>
                  <p className="font-medium text-slate-600">
                    We sent a sign-in link to{" "}
                    <strong className="text-slate-900">
                      {magicRecipientEmail}
                    </strong>
                    . Open it on this device to continue.
                  </p>
                  <button
                    type="button"
                    className="text-teal-600 font-bold hover:text-teal-500 text-sm transition-colors"
                    onClick={() => {
                      setMagicSent(false);
                      setMagicRecipientEmail("");
                    }}
                  >
                    ← Use a different email
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-bold text-slate-700 ml-1"
                      htmlFor="magic-email"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                        aria-hidden
                      />
                      <Input
                        id="magic-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="h-12 pl-11 rounded-xl"
                        error={errors.email?.message}
                        {...register("email", EMAIL_RULES)}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium px-1">
                      New here? Use{" "}
                      <Link
                        to={registerHref}
                        className="text-teal-600 font-bold hover:underline"
                      >
                        Create account
                      </Link>{" "}
                      instead.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    variant="primary"
                    className="w-full h-14 font-black text-base shadow-xl shadow-teal-500/10"
                    disabled={loading}
                    onClick={() => void onMagicRequest()}
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

          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 font-bold uppercase tracking-widest text-slate-500">
                New to BLUPRNT?
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-14 gap-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl"
              onClick={() => navigate(registerHref)}
            >
              <UserPlus className="w-5 h-5 shrink-0" aria-hidden />
              Create free account
            </Button>
            <p className="text-center text-sm font-medium text-slate-400">
              Just need a cost range?{" "}
              <Link
                to="/onboarding"
                className="text-teal-600 font-bold hover:underline"
              >
                Get an estimate
              </Link>
            </p>
          </div>
        </div>
      </div>
      <AppSlimFooter className="mt-auto shrink-0 bg-white/50" />
    </div>
  );
}
