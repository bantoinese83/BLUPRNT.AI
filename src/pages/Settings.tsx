import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { useNavigate } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import {
  ArrowLeft,
  User,
  Shield,
  LogOut,
  Download,
  Trash2,
  Loader2,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { UpgradeIcon } from "@/components/ui/UpgradeIcon";

import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [isArchitect, setIsArchitect] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);



  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setUserLoading(true);
      const { data: { user: u } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(u ?? null);
      setDisplayName((u?.user_metadata?.full_name as string) ?? "");

      if (u) {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("status")
          .eq("user_id", u.id)
          .maybeSingle();
        setIsArchitect(sub?.status === "active");
      }

      setUserLoading(false);

    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    navigate("/", { replace: true });
    setLoading(false);
  }

  async function handleSaveProfile() {
    setProfileSaving(true);
    setProfileMessage(null);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() || null },
    });
    setProfileSaving(false);
    if (error) {
      setProfileMessage(error.message || "Couldn't save your name.");
      return;
    }
    setProfileMessage("Saved.");
    setTimeout(() => setProfileMessage(null), 2000);
  }

  async function handleExportData() {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    setExportMessage(null);
    setExportLoading(true);
    try {
      const { data: props } = await supabase
        .from("properties")
        .select("id, postal_code, city, state, country, approximate_location, created_at");
      const propIds = (props ?? []).map((p) => p.id);
      const projs = propIds.length > 0
        ? (await supabase.from("projects").select("*").in("property_id", propIds)).data ?? []
        : [];
      const projectIds = projs.map((p) => p.id);
      let scopeItems: unknown[] = [];
      let invoices: unknown[] = [];
      let lineItems: unknown[] = [];
      let documents: unknown[] = [];
      if (projectIds.length > 0) {
        const [scopeRes, invRes, docsRes] = await Promise.all([
          supabase.from("scope_items").select("*").in("project_id", projectIds),
          supabase.from("invoices").select("*").in("project_id", projectIds),
          supabase.from("documents").select("id, project_id, type, original_filename, created_at").in("project_id", projectIds),
        ]);
        scopeItems = scopeRes.data ?? [];
        invoices = invRes.data ?? [];
        documents = docsRes.data ?? [];
        const invIds = (invRes.data ?? []).map((i: { id: string }) => i.id);
        if (invIds.length > 0) {
          const lineRes = await supabase.from("invoice_line_items").select("*").in("invoice_id", invIds);
          lineItems = lineRes.data ?? [];
        }
      }
      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: u.id,
        email: u.email,
        properties: props ?? [],
        projects: projs,
        scope_items: scopeItems,
        invoices,
        invoice_line_items: lineItems,
        documents,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bluprnt-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage("Download started.");
      setTimeout(() => setExportMessage(null), 3000);
    } catch {
      setExportMessage("Export failed. Try again.");
    } finally {
      setExportLoading(false);
    }
  }

  async function handleChangePassword() {
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setPasswordSaving(false);

    if (error) {
      setPasswordMessage(error.message || "Couldn't update password.");
      return;
    }

    setPasswordMessage("Success! Your password has been updated.");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMessage(null), 3000);
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) return;
    setDeleteMessage(null);
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>("delete-account", {
        method: "POST",
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (e) {
      setDeleteMessage(e instanceof Error ? e.message : "Couldn't delete account.");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (!isSupabaseConfigured()) {


    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-slate-600">Connect your account to manage settings.</p>
        </div>
        <AppSlimFooter className="bg-white/80" />
      </div>
    );
  }

  if (userLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Settings — BLUPRNT.AI</title>
      </Helmet>

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile();
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="bg-slate-50"
                  autoComplete="email"
                />
                <p className="text-xs text-slate-500">
                  Email is managed by your sign-in provider. Contact support to change it.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="displayName">
                  Display name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              {profileMessage && (
                <p className={`text-sm ${profileMessage === "Saved." ? "text-slate-900 font-bold" : "text-amber-700 font-medium"}`}>

                  {profileMessage}
                </p>
              )}
              <Button
                variant="primary"
                size="sm"
                disabled={profileSaving}
                type="submit"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>


        {user?.email && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChangePassword();
                }}
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-900">Change password</h4>
                  <p className="text-xs text-slate-500">
                    Update your account password.
                  </p>
                </div>
                
                {/* Hidden username field for accessibility/password managers */}
                <input type="text" name="username" autoComplete="email" value={user.email} readOnly className="hidden" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="new-password">
                      New Password
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-10"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="confirm-password">
                      Confirm Password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-10"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {passwordMessage && (
                  <p className={`text-sm ${passwordMessage.includes("Success") ? "text-slate-900 font-bold" : "text-amber-700 font-medium"}`}>
                    {passwordMessage}
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={passwordSaving || !newPassword}
                  type="submit"
                  className="w-full sm:w-auto"
                >
                  {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        )}



        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Plan & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isArchitect ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {isArchitect ? <UpgradeIcon className="w-5 h-5 brightness-0 invert" /> : <User className="w-5 h-5" />}
                </div>


                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                    {isArchitect ? "Architect Plan" : "Free Plan"}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {isArchitect ? "Active Monthly Subscription" : "Limited features"}
                  </p>
                </div>
              </div>
              <Button 
                variant={isArchitect ? "outline" : "primary"} 
                size="sm" 
                className="rounded-xl shadow-sm"
                onClick={() => setShowUpgrade(true)}
                type="button"
              >
                {isArchitect ? "View Plan Options" : "Upgrade"}
              </Button>
            </div>

            {!isArchitect && (
              <p className="text-xs text-slate-500 leading-relaxed px-1">
                Upgrade to Architect for unlimited estimates, more projects, and priority support.
              </p>
            )}
            {isArchitect && (
              <p className="text-xs text-slate-500 leading-relaxed px-1">
                You have active professional features. Billing is handled through Stripe.
              </p>
            )}
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Export your data</h4>
              <p className="text-sm text-slate-600">
                Download a copy of your properties, projects, invoices, and documents in JSON format.
              </p>
              {exportMessage && (
                <p className={`text-sm ${exportMessage === "Download started." ? "text-slate-900 font-bold" : "text-amber-700 font-medium"}`}>

                  {exportMessage}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportData}
                disabled={exportLoading}
                type="button"
              >
                {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export data
              </Button>
            </div>
            <div className="border-t border-slate-200 pt-6 space-y-2">
              <h4 className="font-medium text-slate-900">Delete account</h4>
              <p className="text-sm text-slate-600">
                Permanently delete your account and all data. This cannot be undone.
              </p>
              <div className="flex items-center gap-1">
                <input
                  id="delete-confirm"
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="delete-confirm" className="text-sm text-slate-700">
                  I understand this is permanent
                </label>
              </div>
              {deleteMessage && (
                <p className="text-sm text-amber-700">{deleteMessage}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={handleDeleteAccount}
                disabled={!deleteConfirm || deleteLoading}
                type="button"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete account
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <HelpCircle className="w-5 h-5" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Got a question, need help with an estimate, or have an idea for a new feature? We're here to help you get the most out of BLUPRNT.AI.
            </p>
            <a href="mailto:support@bluprntai.com" className="inline-block">
              <Button
                variant="outline"
                className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                type="button"
              >
                Message our support team
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full gap-2 text-slate-600 border-slate-200"
              onClick={handleSignOut}
              disabled={loading}
              type="button"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </main>

      <AppSlimFooter className="bg-white/80" />

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)}
        openReason="general"
      />
    </div>

  );
}
