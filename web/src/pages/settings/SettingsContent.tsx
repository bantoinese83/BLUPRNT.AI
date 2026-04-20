import { Helmet } from "react-helmet-async";

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

import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { META_ROBOTS_NOINDEX } from "@/lib/seo-meta";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";

import { PRICING } from "@shared/constants/pricing";
import {
  ArchitectPlanIcon,
  ProjectPassIcon,
} from "@/components/icons/PlanMarks";
import {
  architectBillingChannel,
  hasDuplicateWebAndStoreSubscriptions,
} from "@shared/lib/subscription-billing";

import type { SettingsContentProps } from "./settings-content.types";

export function SettingsContent(props: SettingsContentProps) {
  const {
    user,
    displayName,
    setDisplayName,
    profileSaving,
    profileMessage,
    onSaveProfile,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordSaving,
    passwordMessage,
    onChangePassword,
    exportMessage,
    exportLoading,
    onExportData,
    deleteMessage,
    deleteConfirm,
    setDeleteConfirm,
    deleteLoading,
    onDeleteAccount,
    isArchitect,
    subscriptionRow,
    showUpgrade,
    setShowUpgrade,
    upgradeProjectId,
    signOutLoading,
    onSignOut,
    onBack,
  } = props;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Settings — BLUPRNT.AI</title>
        <meta
          name="description"
          content="Manage your BLUPRNT account, billing, privacy, and security settings."
        />
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
      </Helmet>

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onBack}
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
              <User className="w-5 h-5 text-teal-500" />
              Account Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                void onSaveProfile();
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
                  className="rounded-xl border-slate-200 focus:ring-teal-500/20"
                  autoComplete="name"
                />
              </div>
              {profileMessage && (
                <p
                  className={`text-sm ${profileMessage === "Saved." ? "text-teal-600 font-bold" : "text-amber-600 font-medium"}`}
                >
                  {profileMessage}
                </p>
              )}
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto rounded-xl liquid-metal-button shadow-teal-200/50"
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
                <Shield className="w-5 h-5 text-teal-500" />
                Security & Password
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  void onChangePassword();
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
                    className={`text-sm ${passwordMessage.includes("Success") ? "text-teal-600 font-bold" : "text-amber-600 font-medium"}`}
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
              <CreditCard className="w-5 h-5 text-teal-500" />
              Plan & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {isArchitect &&
              subscriptionRow &&
              hasDuplicateWebAndStoreSubscriptions(subscriptionRow) && (
                <div
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                  role="status"
                >
                  <p className="font-bold text-amber-950 mb-1">
                    Possible duplicate subscription
                  </p>
                  <p className="font-medium leading-relaxed text-amber-950/95">
                    We see both a web (Stripe) subscription and an app store
                    subscription. Cancel one to avoid paying twice — use the
                    Stripe customer portal for web, or Subscriptions in the App
                    Store for the iOS app.
                  </p>
                </div>
              )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-50/80 border border-slate-200 rounded-3xl gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isArchitect ? "bg-slate-900 text-white shadow-slate-700/50" : "bg-white text-slate-400 shadow-slate-200/50 border border-slate-100"}`}
                >
                  {isArchitect ? (
                    <ArchitectPlanIcon className="w-8 h-8" />
                  ) : (
                    <ProjectPassIcon className="w-8 h-8" />
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
                className={`rounded-2xl shadow-lg px-8 ${!isArchitect ? "liquid-metal-button shadow-teal-200/50" : "border-slate-200"}`}
                onClick={() => setShowUpgrade(true)}
                type="button"
              >
                {isArchitect ? "Manage Plan" : "Upgrade Now"}
              </Button>
            </div>

            <div className="px-2">
              {!isArchitect ? (
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Architect is{" "}
                  <span className="text-slate-900 font-bold">
                    ${PRICING.architectUsdPerMonth}/mo
                  </span>{" "}
                  with{" "}
                  <span className="text-slate-900 font-bold">
                    professional AI generation
                  </span>
                  , 10 smart document scans per month, and priority project
                  strategy. Project Pass is ${PRICING.projectPassUsdOneTime}{" "}
                  one-time per project.
                </p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {subscriptionRow &&
                  architectBillingChannel(subscriptionRow) === "stripe"
                    ? "You have full access to professional renovation tools. Billing and invoices are handled securely through Stripe."
                    : subscriptionRow &&
                        architectBillingChannel(subscriptionRow) === "store"
                      ? "You have full access to professional tools. This subscription is billed through the App Store (iOS) — manage or cancel there."
                      : "You have full access to professional renovation tools. Manage billing wherever you subscribed (Stripe on the web, or the App Store on iOS)."}
                </p>
              )}
              <p className="text-xs text-slate-500 leading-relaxed font-medium border-t border-slate-100 pt-4 mt-2">
                Plans on the website are billed through Stripe. If you subscribe
                in the iOS app, manage or cancel in the App Store — use the same
                place you subscribed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Shield className="w-5 h-5 text-teal-500" />
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
                  Download a single file with your properties, projects, scope,
                  and documents—useful for backups or moving your data.
                </p>
              </div>
              {exportMessage && (
                <p
                  className={`text-sm ${exportMessage === "Download started." ? "text-teal-600 font-bold" : "text-amber-600 font-medium"}`}
                >
                  {exportMessage}
                </p>
              )}
              <Button
                variant="outline"
                size="lg"
                className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
                onClick={() => void onExportData()}
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
                  className="w-4 h-4 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500"
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
                onClick={() => void onDeleteAccount()}
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
              <HelpCircle className="w-5 h-5 text-teal-500" />
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
                className="w-full gap-2 text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300 rounded-xl"
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
            onClick={() => void onSignOut()}
            disabled={signOutLoading}
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
