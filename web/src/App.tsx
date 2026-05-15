/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { MotionConfig, motion } from "motion/react";
import { AuthProvider } from "@/contexts/AuthProvider";
import { OnboardingProvider } from "@/contexts/OnboardingProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";
import { Toaster } from "sonner";
import { WebOfflineBanner } from "@/components/WebOfflineBanner";
import { ConsentAwareAnalytics } from "@/components/ConsentAwareAnalytics";
import { ForceUpdateGate } from "@/components/ForceUpdateGate";
import {
  WEB_APP_PATH_PRIVACY,
  WEB_APP_PATH_SUPPORT,
  WEB_APP_PATH_TERMS,
} from "@shared/constants/public-site";
import { isHeavyGlobalChromeDeferredPath } from "@/lib/marketing-surfaces";
import Landing from "./pages/Landing";

const CommandPalette = lazy(() =>
  import("@/components/CommandPalette").then((m) => ({
    default: m.CommandPalette,
  })),
);
const HelpWidget = lazy(() =>
  import("@/components/HelpWidget").then((m) => ({ default: m.HelpWidget })),
);

/** Command palette + help widget: omit on marketing surfaces for a smaller landing JS payload. */
function DeferredGlobalChrome() {
  const { pathname } = useLocation();
  if (isHeavyGlobalChromeDeferredPath(pathname)) return null;
  return (
    <Suspense fallback={null}>
      <CommandPalette />
      <HelpWidget />
    </Suspense>
  );
}

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectView = lazy(() => import("./pages/ProjectView"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const SignedOut = lazy(() => import("./pages/SignedOut"));
const Support = lazy(() => import("./pages/Support"));

const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));
const E2EPopupProbe = lazy(() => import("./pages/E2EPopupProbe"));
const E2EOfflineSaveProbe = lazy(() => import("./pages/E2EOfflineSaveProbe"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnReconnect: true,
    },
  },
});

export default function App() {
  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  return (
    <HelmetProvider>
      {/*
        Keep document language on lazy routes: while Suspense shows a fallback, page-level Helmet is not mounted
        yet — react-helmet-async can otherwise clear <html lang> until hydration completes.
      */}
      <Helmet htmlAttributes={{ lang: "en" }} />
      {/*
        Motion’s default is reducedMotion="never" — opt into OS “reduce motion” for all motion.* / AnimatePresence.
        Transform and layout animations are then skipped; opacity-style transitions may still run.
      */}
      <MotionConfig reducedMotion="user">
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ForceUpdateGate>
              <BrowserRouter>
                <AuthProvider>
                  <ScrollToTop />
                  <a
                    href="#main-content"
                    className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-24 focus-visible:z-100 focus-visible:inline-flex focus-visible:items-center focus-visible:rounded-xl focus-visible:bg-teal-950 focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-white focus-visible:shadow-lg focus-visible:shadow-teal-950/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    onClick={(e) => {
                      const main = document.getElementById("main-content");
                      if (!main) return;
                      e.preventDefault();
                      main.focus({ preventScroll: true });
                      main.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== " ") return;
                      const main = document.getElementById("main-content");
                      if (!main) return;
                      e.preventDefault();
                      main.focus({ preventScroll: true });
                      main.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    Skip to main content
                  </a>
                  <WebOfflineBanner />
                  <motion.div
                    id="main-content"
                    tabIndex={-1}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="min-h-0 outline-none focus:outline-none"
                  >
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route
                          path="/onboarding/*"
                          element={
                            <OnboardingProvider>
                              <Onboarding />
                            </OnboardingProvider>
                          }
                        />
                        <Route
                          path="/auth/callback"
                          element={<AuthCallback />}
                        />
                        <Route path="/signed-out" element={<SignedOut />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPassword />}
                        />
                        <Route
                          path="/auth/reset-password"
                          element={<ResetPassword />}
                        />

                        <Route
                          path="/dashboard/*"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/project/:token"
                          element={<ProjectView />}
                        />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute>
                              <Settings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path={WEB_APP_PATH_PRIVACY}
                          element={<PrivacyPolicy />}
                        />
                        <Route
                          path={WEB_APP_PATH_TERMS}
                          element={<TermsOfService />}
                        />
                        <Route
                          path={WEB_APP_PATH_SUPPORT}
                          element={<Support />}
                        />
                        {import.meta.env.VITE_E2E === "1" ? (
                          <>
                            <Route
                              path="/__e2e__/popup-probe"
                              element={<E2EPopupProbe />}
                            />
                            <Route
                              path="/__e2e__/offline-save"
                              element={<E2EOfflineSaveProbe />}
                            />
                          </>
                        ) : null}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </motion.div>
                  <Toaster
                    position="top-right"
                    expand={false}
                    richColors
                    closeButton
                    visibleToasts={4}
                    offset="1.5rem"
                    toastOptions={{
                      className:
                        "glass !border-white/20 !bg-white/40 backdrop-blur-xl !shadow-elevated font-sans text-[15px] leading-snug",
                      style: {
                        borderRadius: "1rem",
                      },
                    }}
                  />
                  <CookieConsent />
                  <DeferredGlobalChrome />
                  <ConsentAwareAnalytics />
                </AuthProvider>
              </BrowserRouter>
            </ForceUpdateGate>
          </QueryClientProvider>
        </ErrorBoundary>
      </MotionConfig>
    </HelmetProvider>
  );
}
