import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ensureUserHasWorkspace } from "@/lib/ensure-user-workspace";
import { getSafeRedirect } from "@/lib/safe-redirect";

/**
 * OAuth (Google) and magic-link redirects land here. PKCE: ?code=…
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function run() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          navigate(
            `/login?error=${encodeURIComponent(error.message)}`,
            { replace: true },
          );
          return;
        }
        window.history.replaceState({}, "", `${url.pathname}${url.hash}`);
      }

      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        for (let i = 0; i < 8 && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 150));
          session = (await supabase.auth.getSession()).data.session;
          if (session) break;
        }
      }

      if (cancelled) return;

      if (!session?.user) {
        navigate(
          "/login?error=" +
            encodeURIComponent(
              "Sign-in didn’t finish. Try again or use another method.",
            ),
          { replace: true },
        );
        return;
      }

      if (cancelled) return;
      setMessage("Setting up your workspace…");
      await ensureUserHasWorkspace(session.user.id);
      if (cancelled) return;
      let redirectTo = "/dashboard";
      try {
        const stored = sessionStorage.getItem("bluprnt_auth_redirect");
        if (stored) {
          sessionStorage.removeItem("bluprnt_auth_redirect");
          redirectTo = getSafeRedirect(stored);
        }
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      navigate(redirectTo, { replace: true });
    }

    run().catch(() => {
      if (!cancelled) {
        navigate(
          "/login?error=" +
            encodeURIComponent("Something went wrong. Please try again."),
          { replace: true },
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6 text-slate-600">
      <Loader2 className="w-10 h-10 text-slate-900 animate-spin" aria-hidden />

      <p className="text-sm font-medium text-center">{message}</p>
    </div>
  );
}
