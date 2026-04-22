import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const DEFAULT_SIGNED_OUT_PATH = "/signed-out";

/**
 * Standardized hook for signing out of the application.
 * Handles Supabase sign-out, local storage cleanup, and consistent redirects.
 */
export function useLogout() {
  const navigate = useNavigate();

  const logout = useCallback(
    async (redirectPath?: string) => {
      const destination = redirectPath ?? DEFAULT_SIGNED_OUT_PATH;
      try {
        const { error } = await supabase.auth.signOut();

        // Cleanup local state/storage
        localStorage.removeItem("bluprnt_project_id");

        if (error) {
          console.error("Logout error:", error);
          toast.error("There was a problem signing out.");
          navigate("/", { replace: true });
          return;
        }

        toast.success("You're signed out.");
        navigate(destination, { replace: true });
      } catch (err) {
        console.error("Logout fatal error:", err);
        toast.error("There was a problem signing out.");
        navigate("/", { replace: true });
      }
    },
    [navigate],
  );

  return { logout };
}
