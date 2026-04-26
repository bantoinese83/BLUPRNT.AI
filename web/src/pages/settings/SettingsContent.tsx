import { Helmet } from "react-helmet-async";

import { ArrowLeft, LogOut, HelpCircle } from "lucide-react";
import { AIAssistantWidget } from "@/components/AIAssistantWidget";

import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { META_ROBOTS_NOINDEX } from "@/lib/seo-meta";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";

import { AccountProfileSection } from "@/components/settings/AccountProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { BillingSection } from "@/components/settings/BillingSection";
import { PrivacySection } from "@/components/settings/PrivacySection";

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
    analyticsEnabled,
    onAnalyticsToggle,
    isAssistantOpen,
    setIsAssistantOpen,
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
        <AccountProfileSection
          user={user}
          displayName={displayName}
          setDisplayName={setDisplayName}
          profileSaving={profileSaving}
          profileMessage={profileMessage}
          onSaveProfile={onSaveProfile}
        />

        <SecuritySection
          user={user}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordSaving={passwordSaving}
          passwordMessage={passwordMessage}
          onChangePassword={onChangePassword}
        />

        <BillingSection
          isArchitect={isArchitect}
          subscriptionRow={subscriptionRow}
          setShowUpgrade={setShowUpgrade}
        />

        <PrivacySection
          exportMessage={exportMessage}
          exportLoading={exportLoading}
          onExportData={onExportData}
          analyticsEnabled={analyticsEnabled}
          onAnalyticsToggle={onAnalyticsToggle}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          deleteMessage={deleteMessage}
          deleteLoading={deleteLoading}
          onDeleteAccount={onDeleteAccount}
        />

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
            <Button
              variant="outline"
              className="w-full gap-2 text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300 rounded-xl"
              type="button"
              onClick={() => setIsAssistantOpen(true)}
            >
              Chat with Concierge Support
            </Button>
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
        isArchitect={isArchitect}
      />

      <AIAssistantWidget
        projectId={upgradeProjectId ?? ""}
        isOpen={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
      />
    </div>
  );
}
