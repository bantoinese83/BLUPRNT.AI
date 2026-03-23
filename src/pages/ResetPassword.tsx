import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Loader } from "@/components/ui/Loader";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Basic verification of session or recovery hash
    const checkHash = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         // Not an error yet, as they might have just landed from the link
      }
    };
    checkHash();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Service temporarily unavailable.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (err) {
      setError(err.message || "Couldn't update your password. Try again.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Loader title="Updating password..." subtitle="Securing your account" size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>New Password — BLUPRNT.AI</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center mb-4">
            <Breadcrumbs className="bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-100 shadow-sm" />
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-xl shadow-slate-100/50 ring-4 ring-white border border-slate-100 overflow-hidden">
              <img src="/bluprnt_logo.svg" alt="BLUPRNT logo" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
              <p className="text-slate-500 text-sm">
                Make sure it's at least 8 characters long.
              </p>
            </div>
          </div>

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-4 shadow-sm border-l-4">
              <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">Success!</h3>
                <p className="text-sm text-slate-600 font-medium">
                  Your password has been updated. Redirecting you to sign in...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10"
                    required
                    autoFocus
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-10"
                    required
                    placeholder="Repeat your password"
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
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
