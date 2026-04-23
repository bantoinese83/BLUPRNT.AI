import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { useAuth } from "@/hooks/use-auth";
import { resolvePostLoginHref } from "@/lib/onboarding-post-auth-redirect";
import { META_ROBOTS_NOINDEX } from "@/lib/seo-meta";

export default function SignedOut() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate(resolvePostLoginHref(null), { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || user) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6"
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <Helmet>
          <title>Signed out — BLUPRNT.AI</title>
          <meta name="robots" content={META_ROBOTS_NOINDEX} />
        </Helmet>
        <img
          src="/bluprnt_logo.webp"
          alt=""
          className="h-14 w-14 object-contain opacity-90"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 p-6 text-center page-fade-in">
      <Helmet>
        <title>Signed out — BLUPRNT.AI</title>
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
      </Helmet>

      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm border border-slate-200 overflow-hidden">
              <img
                src="/bluprnt_logo.webp"
                alt="BLUPRNT.AI logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {"You're signed out"}
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              {
                "Thanks for stopping by. When you're ready, head home or sign in again."
              }
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" replace>
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto font-medium px-8 h-12"
              >
                Continue
              </Button>
            </Link>
            <Link to="/login" replace>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto font-medium px-8 h-12"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <AppSlimFooter />
    </div>
  );
}
