import React, { useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { extractPkceCodeFromUrl, getAuthRedirectUrl } from "@/lib/auth-linking";
import { registerForPushNotificationsAsync } from "@/lib/push";
import { AuthContext } from "@/contexts/auth-context";

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

        if (session?.user?.id) {
          void registerForPushNotificationsAsync(session.user.id);
        }
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

      if (session?.user?.id) {
        void registerForPushNotificationsAsync(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /** PKCE recovery / magic links: exchange `?code=` when the app opens from a deep link. */
  useEffect(() => {
    let active = true;

    const exchange = async (url: string) => {
      const code = extractPkceCodeFromUrl(url);
      if (!code) return;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error && __DEV__) {
        console.warn("[AuthProvider] exchangeCodeForSession:", error.message);
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url && active) void exchange(url);
    });

    const sub = Linking.addEventListener("url", ({ url }) => {
      void exchange(url);
    });

    return () => {
      active = false;
      sub.remove();
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
      const redirectUri = getAuthRedirectUrl();

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
        const code = extractPkceCodeFromUrl(res.url);
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };
  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });
        if (error) throw error;
      } else {
        throw new Error("No identity token returned from Apple.");
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ERR_REQUEST_CANCELED"
      ) {
        // user cancelled
        return;
      }
      console.error("Apple sign in error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signOut,
        signInWithGoogle,
        signInWithApple,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
