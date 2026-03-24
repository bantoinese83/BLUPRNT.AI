import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Mail,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";

import { Loader } from "@/components/ui/Loader";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("This service isn't available right now. Please try again later.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);

    if (err) {
      setError(err.message || "Couldn't send the reset link. Try again.");
      return;
    }

    setSent(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Loader title="Sending reset link..." subtitle="Checking our systems" size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Forgot Password — BLUPRNT.AI</title>
      </Helmet>
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center mb-4">
            <Breadcrumbs className="bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-100 shadow-sm" />
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-xl shadow-slate-100/50 ring-4 ring-white border border-slate-100 overflow-hidden">
              <img src="/bluprnt_logo.svg" alt="BLUPRNT logo" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
              <p className="text-slate-500 text-sm">
                We'll email you a link to choose a new password.
              </p>
            </div>
          </div>

          {sent ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-slate-900" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900">Check your inbox</h3>
                <p className="text-sm text-slate-500">
                  A reset link has been sent to <strong>{email}</strong>.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </p>
              )}

              <Button type="submit" size="lg" variant="primary" className="w-full">
                <Wand2 className="w-5 h-5 mr-2" />
                Send reset link
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign in
            </Link>
          </div>
        </div>
        </div>
        <AppSlimFooter className="mt-auto shrink-0 bg-white/50" />
      </div>
    </>
  );
}
