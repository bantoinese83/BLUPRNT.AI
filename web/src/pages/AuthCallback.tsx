import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ensureUserHasWorkspace } from "@/lib/ensure-user-workspace";
import { consumeAuthCallbackRedirectHref } from "@/lib/onboarding-post-auth-redirect";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { META_ROBOTS_NOINDEX, seoAbsoluteUrl } from "@/lib/seo-meta";
import { reportClientError } from "@/lib/sentry";
import { Button } from "@/components/ui/button";

/**
 * OAuth (Google) and magic-link redirects land here. PKCE: ?code=…
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [message, setMessage] = useState("Signing you in…");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
      setMessage("Getting things ready…");
      const workspace = await ensureUserHasWorkspace(session.user.id);
      if (cancelled) return;

      if (!workspace.ok) {
        setMessage("");
        setWorkspaceError(
          "We couldn’t finish setting up your account. Check your connection and try again.",
        );
        return;
      }

      const redirectTo = consumeAuthCallbackRedirectHref();
      if (cancelled) return;
      navigate(redirectTo, { replace: true });
    }

    run().catch((err: unknown) => {
      reportClientError("auth_callback", err);
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
  }, [navigate, retryCount]);

  return (
    <>
      <Helmet>
        <title>Signing in — BLUPRNT.AI</title>
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
        <link rel="canonical" href={seoAbsoluteUrl(pathname)} />
      </Helmet>
      <div className="flex min-h-screen flex-col bg-slate-50 p-6 text-slate-600">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          {workspaceError ? (
            <div
              className="mx-auto flex max-w-md flex-col items-center gap-4 text-center"
              role="alert"
            >
              <p className="text-sm font-medium leading-relaxed text-red-800">
                {workspaceError}
              </p>
              <Button
                type="button"
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setWorkspaceError(null);
                  setMessage("Getting things ready…");
                  setRetryCount((c) => c + 1);
                }}
              >
                Try again
              </Button>
              <Link
                to="/login"
                className="text-sm font-bold text-teal-700 underline underline-offset-2 hover:text-teal-600"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <Loader2
                className="h-10 w-10 animate-spin text-slate-900"
                aria-hidden
              />
              <p aria-live="polite" className="text-center text-sm font-medium">
                {message}
              </p>
            </>
          )}
        </div>
        <AppSlimFooter className="shrink-0 bg-slate-100/70" />
      </div>
    </>
  );
}
