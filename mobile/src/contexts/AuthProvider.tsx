import React, { useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./auth-context";

// Tell the browser to complete the session when redirected back
WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      const res = await WebBrowser.openAuthSessionAsync(
        data.url ?? "",
        redirectUri,
      );

      if (res.type === "success" && res.url) {
        // Extract params from URL fragment (#access_token=...)
        const hash = res.url.split("#")[1];
        if (!hash) return;

        const params = Object.fromEntries(
          hash.split("&").map((pair) => pair.split("=")),
        );

        const access_token = params.access_token;
        const refresh_token = params.refresh_token;

        if (access_token && refresh_token) {
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
        }
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signOut, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}
