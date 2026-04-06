import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { PageLoader } from "./PageLoader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/**
 * Wraps routes that require authentication. Redirects to login if not signed in.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      queueMicrotask(() => setChecking(false));
      return;
    }

    if (!loading) {
      if (!user) {
        const returnPath = `${location.pathname}${location.search || ""}`;
        const redirect = getSafeRedirect(returnPath, "/dashboard");
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`, {
          replace: true,
        });
      }
      queueMicrotask(() => setChecking(false));
    }
  }, [user, loading, navigate, location.pathname, location.search]);

  if (checking) return <PageLoader />;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <div className="rounded-2xl bg-amber-100 p-4 text-amber-800">
          <Settings2 className="mx-auto h-10 w-10" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          Can&apos;t connect right now
        </h2>
        <p className="text-sm leading-relaxed text-slate-600">
          We couldn&apos;t reach BLUPRNT. Try again later or go back home.
        </p>
        {import.meta.env.DEV && (
          <p className="text-left text-xs text-slate-500">
            Local setup: add{" "}
            <code className="rounded bg-slate-200 px-1">VITE_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="rounded bg-slate-200 px-1">
              VITE_SUPABASE_ANON_KEY
            </code>{" "}
            in <code className="rounded bg-slate-200 px-1">.env</code>.
          </p>
        )}
        <Button
          variant="outline"
          className="mt-2"
          type="button"
          onClick={() => navigate("/")}
        >
          Back to home
        </Button>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
