import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { resolvePostLoginHref } from "@/lib/onboarding-post-auth-redirect";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";

export function useLogin(redirectParam: string | null) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicRecipientEmail, setMagicRecipientEmail] = useState("");

  const onPasswordLogin = async ({
    email,
    password,
  }: {
    email: string;
    password?: string;
  }) => {
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
    const redirectTo = resolvePostLoginHref(redirectParam);
    navigate(redirectTo, { replace: true });
  };

  const onMagicRequest = async ({ email }: { email: string }) => {
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
  };

  return {
    error,
    setError,
    loading,
    magicSent,
    setMagicSent,
    magicRecipientEmail,
    setMagicRecipientEmail,
    onPasswordLogin,
    onMagicRequest,
  };
}
