import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { PageLoader } from "./PageLoader";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/**
 * Wraps routes that require authentication. Redirects to login if not signed in.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      queueMicrotask(() => {
        setChecking(false);
        setAllowed(false);
      });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setChecking(false);
      if (session?.user) {
        setAllowed(true);
      } else {
        const redirect = getSafeRedirect(location.pathname, "/dashboard");
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
      }
    });
  }, [navigate, location.pathname]);

  if (checking) return <PageLoader />;
  if (!allowed) return null;
  return <>{children}</>;
}
