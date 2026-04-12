/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthProvider";
import { OnboardingProvider } from "@/contexts/OnboardingProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { AuthListener } from "@/components/AuthListener";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/CommandPalette";
import { HelpWidget } from "@/components/HelpWidget";
import { WebOfflineBanner } from "@/components/WebOfflineBanner";
import { ConsentAwareAnalytics } from "@/components/ConsentAwareAnalytics";

const Landing = lazy(() => import("./pages/Landing"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectView = lazy(() => import("./pages/ProjectView"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Support = lazy(() => import("./pages/Support"));

const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
  return (
    <HelmetProvider>
      <AuthProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <a
                href="#main-content"
                className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-24 focus-visible:z-[100] focus-visible:inline-flex focus-visible:items-center focus-visible:rounded-xl focus-visible:bg-teal-950 focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-white focus-visible:shadow-lg focus-visible:shadow-teal-950/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                onClick={(e) => {
                  const main = document.getElementById("main-content");
                  if (!main) return;
                  e.preventDefault();
                  main.focus({ preventScroll: true });
                  main.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                onKeyDown={(e) => {
                  if (e.key !== " ") return;
                  const main = document.getElementById("main-content");
                  if (!main) return;
                  e.preventDefault();
                  main.focus({ preventScroll: true });
                  main.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Skip to main content
              </a>
              <AuthListener />
              <WebOfflineBanner />
              <div
                id="main-content"
                tabIndex={-1}
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
                    <Route path="/auth/callback" element={<AuthCallback />} />
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
                    <Route path="/project/:token" element={<ProjectView />} />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <Toaster position="top-right" expand={false} richColors />
              <CommandPalette />
              <CookieConsent />
              <HelpWidget />
              <ConsentAwareAnalytics />
            </BrowserRouter>
          </QueryClientProvider>
        </ErrorBoundary>
      </AuthProvider>
    </HelmetProvider>
  );
}
