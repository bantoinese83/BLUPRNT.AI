import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { resolvePostLoginHref } from "@/lib/onboarding-post-auth-redirect";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import { reportClientError } from "@/lib/sentry";

export function useRegister(redirectParam: string | null) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const onPasswordRegister = async ({
    email,
    password,
    zip,
  }: {
    email: string;
    password?: string;
    zip: string;
  }) => {
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
          "Check your email to confirm your account, then sign in. Or turn off \u201CConfirm email\u201D in Supabase (Auth \u2192 Email) for instant access.",
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
          owner_user_id: userId,
          name: "My home project",
          type: "other",
          stage: "planning",
        })
        .select("id")
        .single();

      if (jErr || !proj) {
        const next = resolvePostLoginHref(redirectParam);
        navigate(next, { replace: true });
        return;
      }

      try {
        localStorage.setItem("bluprnt_project_id", proj.id);
      } catch (e) {
        console.warn(
          "[register] Could not store project ID in localStorage:",
          e,
        );
      }
      const next = resolvePostLoginHref(redirectParam);
      navigate(next, { replace: true });
    } catch (err: unknown) {
      reportClientError("register_password_submit", err);
      setError("Sign-up failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onMagicRegister = async ({ email }: { email: string }) => {
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
  };

  return {
    error,
    setError,
    loading,
    magicSent,
    setMagicSent,
    onPasswordRegister,
    onMagicRegister,
  };
}
