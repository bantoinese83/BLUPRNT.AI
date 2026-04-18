import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Helmet } from "react-helmet-async";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { AlertCircle, LogIn, Lock, Wand2 } from "lucide-react";

import { RegisterPasswordForm } from "@/components/auth/register/RegisterPasswordForm";
import { RegisterMagicForm } from "@/components/auth/register/RegisterMagicForm";

import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { resolvePostLoginHref } from "@/lib/onboarding-post-auth-redirect";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import {
  WEB_APP_PATH_PRIVACY,
  WEB_APP_PATH_TERMS,
} from "@shared/constants/public-site";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AppSimpleHeader } from "@/components/layout/AppSimpleHeader";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { useAuth } from "@/hooks/use-auth";
import { META_ROBOTS_NOINDEX, seoAbsoluteUrl } from "@/lib/seo-meta";
import { reportClientError } from "@/lib/sentry";

type Mode = "password" | "magic";

type RegisterFormValues = {
  email: string;
  password?: string;
  zip: string;
  acceptedPolicies: boolean;
};

const EMAIL_RULES = {
  required: "Enter your email address.",
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Enter a valid email address.",
  },
} as const;

const ZIP_RULES = {
  required: "ZIP is required.",
  setValueAs: (v: unknown) =>
    String(v ?? "")
      .replace(/\D/g, "")
      .slice(0, 5),
  validate: (v: string) => v.length === 5 || "Use a 5-digit ZIP code.",
} as const;

export default function Register() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const loginHref =
    redirectParam != null && redirectParam.trim() !== ""
      ? `/login?redirect=${encodeURIComponent(redirectParam)}`
      : "/login";
  const [mode, setMode] = useState<Mode>("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    resetField,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      zip: "",
      acceptedPolicies: false,
    },
    shouldUnregister: true,
  });

  const emailValue = watch("email");

  useEffect(() => {
    if (!authLoading && user) {
      const redirectTo = resolvePostLoginHref(searchParams.get("redirect"));
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, navigate, searchParams]);

  const onPasswordRegister = handleSubmit(async ({ email, password, zip }) => {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Sign-up isn't available right now. Please try again later.");
      return;
    }

    setLoading(true);
    try {
      const { data: auth, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password ?? "",
      });
      if (signErr) {
        setError(
          friendlyAuthError(
            signErr.message || "",
            "status" in signErr
              ? (signErr as { status?: number }).status
              : undefined,
          ),
        );
        return;
      }

      let session = auth.session;
      if (!session && auth.user) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password ?? "",
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

      // Step 2: Create Property
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
        throw new Error("Unable to set up your property records.");
      }

      // Step 3: Create Initial Project
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
        // We have an account and a property, but project failed.
        // We'll redirect to dashboard and let them add it manually.
        const next = resolvePostLoginHref(redirectParam);
        navigate(next, { replace: true });
        return;
      }

      try {
        localStorage.setItem("bluprnt_project_id", proj.id);
      } catch {
        /* ignore */
      }
      const next = resolvePostLoginHref(redirectParam);
      navigate(next, { replace: true });
    } catch (err: unknown) {
      reportClientError("register_password_submit", err);
      setError("Sign-up failed. Try again.");
    } finally {
      setLoading(false);
    }
  });

  const onMagicRegister = handleSubmit(async ({ email }) => {
    setError(null);
    setMagicSent(false);
    if (!isSupabaseConfigured()) {
      setError("Sign-in isn't available right now. Please try again later.");
      return;
    }
    if (redirectParam) {
      try {
        sessionStorage.setItem("bluprnt_auth_redirect", redirectParam);
      } catch {
        /* ignore */
      }
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
      setError(
        friendlyAuthError(
          err.message || "",
          "status" in err ? (err as { status?: number }).status : undefined,
        ),
      );
      return;
    }
    setMagicSent(true);
  });

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMagicSent(false);
    if (next === "magic") {
      resetField("password", { defaultValue: "" });
    }
  }

  const policyRegister = register("acceptedPolicies", {
    validate: (v) =>
      v === true || "Agree to the Terms and Privacy Policy to continue.",
  });

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <Helmet>
        <title>Create account — BLUPRNT.AI</title>
        <meta
          name="description"
          content="Start your property journey by creating a free account. Get instant estimates and track your renovation."
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
              Create account
            </h1>
            <p className="text-slate-500 font-medium">
              Start your renovation financial plan for free.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
            <input
              id="register-policies"
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              aria-invalid={errors.acceptedPolicies ? true : undefined}
              aria-describedby={
                errors.acceptedPolicies ? "register-policies-error" : undefined
              }
              {...policyRegister}
              onChange={(e) => {
                void policyRegister.onChange(e);
                if (error?.includes("Agree to")) setError(null);
              }}
            />
            <div className="flex-1">
              <label
                htmlFor="register-policies"
                className="text-sm font-medium text-slate-600 leading-snug cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  to={WEB_APP_PATH_TERMS}
                  className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-600"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to={WEB_APP_PATH_PRIVACY}
                  className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-600"
                >
                  Privacy Policy
                </Link>
                .
              </label>
              {errors.acceptedPolicies ? (
                <p
                  id="register-policies-error"
                  className="mt-1.5 text-xs text-rose-600"
                  role="alert"
                >
                  {errors.acceptedPolicies.message}
                </p>
              ) : null}
            </div>
          </div>

          <AuthSocialButtons
            onError={(msg) => setError(friendlyAuthError(msg))}
            googleLoading={googleLoading}
            setGoogleLoading={setGoogleLoading}
            disabled={!watch("acceptedPolicies")}
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

          {error && (
            <div
              className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-3 flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {mode === "password" ? (
            <RegisterPasswordForm
              onSubmit={onPasswordRegister}
              register={register}
              errors={errors}
              watch={watch}
              loading={loading}
              emailRules={EMAIL_RULES}
              zipRules={ZIP_RULES}
            />
          ) : (
            <RegisterMagicForm
              onMagicRegister={onMagicRegister}
              register={register}
              errors={errors}
              watch={watch}
              loading={loading}
              magicSent={magicSent}
              setMagicSent={setMagicSent}
              emailValue={emailValue}
              emailRules={EMAIL_RULES}
              zipRules={ZIP_RULES}
            />
          )}

          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 font-bold uppercase tracking-widest text-slate-300">
                Already a user?
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-14 gap-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl"
              onClick={() => navigate(loginHref)}
            >
              <LogIn className="w-5 h-5 shrink-0" aria-hidden />
              Sign in to account
            </Button>
          </div>
        </div>
      </div>
      <AppSlimFooter className="mt-auto shrink-0 bg-white/50" />
    </div>
  );
}
