import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";

const PROTECTED_PATHS = ["/dashboard", "/settings"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Listens for auth state changes and redirects from protected routes when signed out.
 */
export function AuthListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);
  const searchRef = useRef(location.search);

  useEffect(() => {
    pathnameRef.current = location.pathname;
    searchRef.current = location.search;
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      const path = `${pathnameRef.current}${searchRef.current || ""}`;
      if (!isProtected(pathnameRef.current)) return;
      const redirect = getSafeRedirect(path, "/dashboard");
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`, {
        replace: true,
      });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}
