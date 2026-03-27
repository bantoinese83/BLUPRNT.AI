import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Standardized hook for signing out of the application.
 * Handles Supabase sign-out, local storage cleanup, and consistent redirects.
 */
export function useLogout() {
  const navigate = useNavigate();

  const logout = useCallback(
    async (redirectPath: string = "/") => {
      try {
        const { error } = await supabase.auth.signOut();

        // Cleanup local state/storage
        localStorage.removeItem("bluprnt_project_id");

        if (error) {
          console.error("Logout error:", error);
          toast.error("There was a problem signing out.");
        }

        // Consistent redirect
        navigate(redirectPath, { replace: true });

        // Force a partial reload if needed to clear in-memory state,
        // but try to avoid window.location.reload() for a smoother SPA experience
        // if the app handles auth state changes gracefully.
      } catch (err) {
        console.error("Logout fatal error:", err);
        navigate(redirectPath, { replace: true });
      }
    },
    [navigate],
  );

  return { logout };
}
