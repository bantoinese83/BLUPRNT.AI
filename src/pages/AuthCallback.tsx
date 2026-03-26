import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ensureUserHasWorkspace } from "@/lib/ensure-user-workspace";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";

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
          navigate(`/login?error=${encodeURIComponent(error.message)}`, {
            replace: true,
          });
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
    <div className="flex min-h-screen flex-col bg-slate-50 p-6 text-slate-600">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2
          className="h-10 w-10 animate-spin text-slate-900"
          aria-hidden
        />
        <p aria-live="polite" className="text-center text-sm font-medium">
          {message}
        </p>
      </div>
      <AppSlimFooter className="shrink-0 bg-slate-100/70" />
    </div>
  );
}
