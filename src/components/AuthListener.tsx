import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const PROTECTED_PATHS = ["/dashboard", "/settings"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Listens for auth state changes and redirects from protected routes when signed out.
 */
export function AuthListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === "SIGNED_OUT" && isProtected(location.pathname)) {
        navigate("/login?redirect=" + encodeURIComponent(location.pathname), {
          replace: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
}
