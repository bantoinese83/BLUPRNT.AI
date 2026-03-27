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
  Crown,
} from "lucide-react";

import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";

import { useLogout } from "@/hooks/use-logout";

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useLogout();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: { full_name?: string };
  } | null>(null);
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
  /** Used for Project Pass checkout from Settings (Stripe metadata). */
  const [upgradeProjectId, setUpgradeProjectId] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setUserLoading(true);
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
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

        const { data: owned } = await supabase
          .from("properties")
          .select("id")
          .eq("owner_user_id", u.id);
        const propIds = (owned ?? []).map((p) => p.id);
        if (propIds.length === 0) {
          setUpgradeProjectId(null);
        } else {
          const { data: projs } = await supabase
            .from("projects")
            .select("id")
            .in("property_id", propIds)
            .order("updated_at", { ascending: false })
            .limit(1);
          setUpgradeProjectId(projs?.[0]?.id ?? null);
        }
      } else {
        setUpgradeProjectId(null);
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
    await logout("/");
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
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) return;
    setExportMessage(null);
    setExportLoading(true);
    try {
      const { data: props } = await supabase
        .from("properties")
        .select(
          "id, postal_code, city, state, country, approximate_location, created_at",
        );
      const propIds = (props ?? []).map((p) => p.id);
      const projs =
        propIds.length > 0
          ? ((
              await supabase
                .from("projects")
                .select("*")
                .in("property_id", propIds)
            ).data ?? [])
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
          supabase
            .from("documents")
            .select("id, project_id, type, original_filename, created_at")
            .in("project_id", projectIds),
        ]);
        scopeItems = scopeRes.data ?? [];
        invoices = invRes.data ?? [];
        documents = docsRes.data ?? [];
        const invIds = (invRes.data ?? []).map((i: { id: string }) => i.id);
        if (invIds.length > 0) {
          const lineRes = await supabase
            .from("invoice_line_items")
            .select("*")
            .in("invoice_id", invIds);
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
      const { data, error } = await supabase.functions.invoke<{
        success?: boolean;
        error?: string;
      }>("delete-account", {
        method: "POST",
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (e) {
      setDeleteMessage(
        e instanceof Error ? e.message : "Couldn't delete account.",
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-slate-600">
            Connect your account to manage settings.
          </p>
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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <User className="w-5 h-5 text-indigo-500" />
              Account Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile();
              }}
            >
              <div className="space-y-2">
                <label
                  className="text-xs font-bold text-slate-500 uppercase tracking-widest"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="bg-slate-50/50 border-slate-200 rounded-xl"
                  autoComplete="email"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Email is managed by your sign-in provider.
                </p>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-bold text-slate-500 uppercase tracking-widest"
                  htmlFor="displayName"
                >
                  Display Name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl border-slate-200 focus:ring-indigo-500/20"
                  autoComplete="name"
                />
              </div>
              {profileMessage && (
                <p
                  className={`text-sm ${profileMessage === "Saved." ? "text-indigo-600 font-bold" : "text-amber-600 font-medium"}`}
                >
                  {profileMessage}
                </p>
              )}
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto rounded-xl liquid-metal-button shadow-indigo-200/50"
                disabled={profileSaving}
                type="submit"
              >
                {profileSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {user?.email && (
          <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <Shield className="w-5 h-5 text-indigo-500" />
                Security & Password
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChangePassword();
                }}
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Update Password
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Ensure your account is using a long, random password to stay
                    secure.
                  </p>
                </div>

                <input
                  type="text"
                  name="username"
                  autoComplete="email"
                  value={user.email}
                  readOnly
                  className="hidden"
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"
                      htmlFor="new-password"
                    >
                      New Password
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 rounded-xl border-slate-200"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"
                      htmlFor="confirm-password"
                    >
                      Confirm Password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 rounded-xl border-slate-200"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {passwordMessage && (
                  <p
                    className={`text-sm ${passwordMessage.includes("Success") ? "text-indigo-600 font-bold" : "text-amber-600 font-medium"}`}
                  >
                    {passwordMessage}
                  </p>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  disabled={passwordSaving || !newPassword}
                  type="submit"
                  className="w-full sm:w-auto rounded-xl border-slate-200 hover:bg-slate-50"
                >
                  {passwordSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              Plan & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-50/80 border border-slate-200 rounded-3xl gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isArchitect ? "bg-slate-900 text-white shadow-slate-700/50" : "bg-white text-slate-400 shadow-slate-200/50 border border-slate-100"}`}
                >
                  {isArchitect ? (
                    <Crown className="w-7 h-7" />
                  ) : (
                    <User className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-base font-black text-slate-900 leading-none">
                    {isArchitect ? "Architect Plan" : "Free Explorer"}
                  </p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {isArchitect
                      ? "Active Monthly Subscription"
                      : "Standard Features Only"}
                  </p>
                </div>
              </div>
              <Button
                variant={isArchitect ? "outline" : "primary"}
                size="lg"
                className={`rounded-2xl shadow-lg px-8 ${!isArchitect ? "liquid-metal-button shadow-indigo-200/50" : "border-slate-200"}`}
                onClick={() => setShowUpgrade(true)}
                type="button"
              >
                {isArchitect ? "Manage Plan" : "Upgrade Now"}
              </Button>
            </div>

            <div className="px-2">
              {!isArchitect ? (
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Unlock{" "}
                  <span className="text-slate-900 font-bold">
                    Professional AI Generation
                  </span>
                  , 10 smart document scans per month, and priority project
                  strategy consultations.
                </p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  You have full access to professional renovation tools. Billing
                  and invoices are handled securely through Stripe.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Shield className="w-5 h-5 text-indigo-500" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">
                  Export Project Data
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Download a comprehensive JSON archive of your properties,
                  projects, scope items, and documents.
                </p>
              </div>
              {exportMessage && (
                <p
                  className={`text-sm ${exportMessage === "Download started." ? "text-indigo-600 font-bold" : "text-amber-600 font-medium"}`}
                >
                  {exportMessage}
                </p>
              )}
              <Button
                variant="outline"
                size="lg"
                className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
                onClick={handleExportData}
                disabled={exportLoading}
                type="button"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Generate Export
              </Button>
            </div>

            <div className="border-t border-slate-100 pt-8 space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  Danger Zone
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Permanently delete your account and all associated data. This
                  action is immediate and IRREVERSIBLE.
                </p>
              </div>
              <div className="flex items-center gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                <input
                  id="delete-confirm"
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="w-4 h-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="delete-confirm"
                  className="text-sm text-slate-700 font-bold select-none cursor-pointer"
                >
                  I understand this is permanent
                </label>
              </div>
              {deleteMessage && (
                <p className="text-sm text-amber-700 font-bold px-1">
                  {deleteMessage}
                </p>
              )}
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-xl"
                onClick={handleDeleteAccount}
                disabled={!deleteConfirm || deleteLoading}
                type="button"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete My Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              Support & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Have questions or need assistance with your project strategy? Our
              team is ready to help you optimize your renovation budget.
            </p>
            <a
              href="mailto:connect@monarch-labs.com"
              className="inline-block w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="w-full gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl"
                type="button"
              >
                Contact Concierge Support
              </Button>
            </a>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 text-slate-500 border-slate-200 rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all font-bold"
            onClick={handleSignOut}
            disabled={loading}
            type="button"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </main>

      <AppSlimFooter className="bg-white/80" />

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        openReason="general"
        projectId={upgradeProjectId}
      />
    </div>
  );
}
