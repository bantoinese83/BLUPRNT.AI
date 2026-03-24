import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-4 max-w-md mx-auto">
        <div className="rounded-2xl bg-amber-100 p-4 text-amber-800">
          <Settings2 className="w-10 h-10 mx-auto" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          BLUPRNT isn&apos;t connected yet
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          This copy of the app needs your project keys to load. Check the README
          in the project folder for setup steps.
        </p>
        <p className="text-xs text-slate-500">
          Add{" "}
          <code className="bg-slate-200 px-1 rounded">VITE_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="bg-slate-200 px-1 rounded">
            VITE_SUPABASE_ANON_KEY
          </code>{" "}
          in <code className="bg-slate-200 px-1 rounded">.env</code>.
        </p>
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
