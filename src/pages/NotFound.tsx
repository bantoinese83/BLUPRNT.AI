import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { supabase } from "@/lib/supabase";

export default function NotFound() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 p-6 text-center page-fade-in">
      <Helmet>
        <title>Page Not Found — BLUPRNT.AI</title>
      </Helmet>

      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: [0, -5, 5, -3, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm border border-slate-200 overflow-hidden"
            >
              <img
                src="/bluprnt_logo.svg"
                alt="BLUPRNT.AI logo"
                className="h-full w-full object-contain"
              />
            </motion.div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mx-auto max-w-[12ch]">
              Lost your way?
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              We couldn't find the page you're looking for. It might have been
              moved or the link is broken.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto font-medium px-8 h-12"
              >
                Return to Homepage
              </Button>
            </Link>
            {isLoggedIn && (
              <Link to="/dashboard">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto font-medium px-8 h-12"
                >
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
      <AppSlimFooter className="shrink-0 bg-slate-100/70" />
    </div>
  );
}
