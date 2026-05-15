import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AuthContext } from "./auth-context";
import * as Sentry from "@sentry/react";
import { reportClientError } from "@/lib/sentry";
import { loginPathAfterSignOut } from "@/lib/auth-sign-out-redirect";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);
  const searchRef = useRef(location.search);

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pathnameRef.current = location.pathname;
    searchRef.current = location.search;
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        reportClientError("auth_initial_session", err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_OUT") {
        const loginPath = loginPathAfterSignOut(
          pathnameRef.current,
          searchRef.current,
        );
        if (loginPath) {
          navigate(loginPath, { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (user?.id) {
      Sentry.setUser({ id: user.id, email: user.email });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const contextValue = useMemo(
    () => ({ session, user, loading, signOut }),
    [session, user, loading, signOut],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
