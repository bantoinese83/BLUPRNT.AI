import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { GoogleIcon } from "./GoogleIcon";

type AuthSocialButtonsProps = {
  onError: (message: string) => void;
  googleLoading: boolean;
  setGoogleLoading: (v: boolean) => void;
};

export function AuthSocialButtons({
  onError,
  googleLoading,
  setGoogleLoading,
}: AuthSocialButtonsProps) {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  async function signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      onError("Connect Supabase in your .env first.");
      return;
    }
    if (redirect) {
      try {
        sessionStorage.setItem("blueprintai_auth_redirect", redirect);
      } catch {
        /* ignore */
      }
    }
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: { prompt: "select_account" },
      },
    });
    setGoogleLoading(false);
    if (error) onError(error.message || "Couldn’t start Google sign-in.");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full h-12 gap-3 bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
      onClick={signInWithGoogle}
      disabled={googleLoading}
    >
      {googleLoading ? (
        <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
      ) : (
        <GoogleIcon className="w-5 h-5 shrink-0" />
      )}
      Continue with Google
    </Button>
  );
}
