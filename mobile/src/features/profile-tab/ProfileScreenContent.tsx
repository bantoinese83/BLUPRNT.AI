import React from "react";
import { View, Text, TouchableOpacity, TextInput, Switch } from "react-native";
import {
  User,
  LogOut,
  Shield,
  Lock,
  Download,
  Trash2,
  Mail,
  FileText,
  HelpCircle,
  TrendingUp,
  MessageSquare,
} from "lucide-react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { MotiView } from "moti";
import { router } from "expo-router";
import Constants from "expo-constants";

import { ScreenWrapper } from "@/components/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Theme } from "@/constants/Theme";
import { PRICING } from "@shared/constants/pricing";
import {
  WEB_APP_PATH_PRIVACY,
  WEB_APP_PATH_TERMS,
} from "@shared/constants/public-site";
import {
  ArchitectPlanIcon,
  ProjectPassIcon,
} from "@/components/icons/PlanMarks";
import {
  architectBillingChannel,
  hasDuplicateWebAndStoreSubscriptions,
} from "@shared/lib/subscription-billing";
import { profileTabStyles as styles } from "@/features/profile-tab/profile-tab.styles";
import { ProfileSettingItem } from "@/features/profile-tab/ProfileSettingItem";

import type { ProfileScreenContentProps } from "./profile-screen.types";

export function ProfileScreenContent(props: ProfileScreenContentProps) {
  const {
    user,
    isPro,
    subscription,
    displayName,
    setDisplayName,
    saving,
    onSaveProfile,
    exporting,
    onExportData,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordSaving,
    onUpdatePasswordInApp,
    analyticsEnabled,
    onAnalyticsToggle,
    onUpgrade,
    onEmailResetLink,
    onDeleteAccount,
    onSignOut,
  } = props;

  return (
    <ScreenWrapper
      withLogo
      withScroll
      withKeyboard
      edges={["top", "left", "right"]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
      >
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Profile</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User
                size={18}
                color={Theme.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                testID="profile-name-input"
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={Theme.colors.text.disabled}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, styles.disabledInput]}>
              <Mail
                size={18}
                color={Theme.colors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: Theme.colors.text.muted }]}
                value={user?.email}
                editable={false}
              />
            </View>
          </View>
          <Button
            testID="profile-save-button"
            title={saving ? "Saving..." : "Save Profile"}
            onPress={onSaveProfile}
            disabled={saving}
            loading={saving}
            style={styles.saveButton}
          />
        </GlassCard>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 100 }}
      >
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Membership</Text>
          {isPro &&
            subscription &&
            hasDuplicateWebAndStoreSubscriptions(subscription) && (
              <View style={styles.duplicateSubBanner} accessibilityRole="alert">
                <Text style={styles.duplicateSubTitle}>
                  Possible duplicate subscription
                </Text>
                <Text style={styles.duplicateSubBody}>
                  We see billing on both the web (Stripe) and the app store.
                  Cancel one to avoid paying twice.
                </Text>
              </View>
            )}
          <View style={[styles.planCard, isPro && styles.architectPlanCard]}>
            <View style={[styles.planIcon, isPro && styles.architectIcon]}>
              {isPro ? (
                <ArchitectPlanIcon size={26} />
              ) : (
                <ProjectPassIcon size={26} />
              )}
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>
                {isPro ? "Architect Plan" : "Free Explorer"}
              </Text>
              <Text style={styles.planStatus}>
                {isPro
                  ? "Premium AI insights enabled"
                  : `From $${PRICING.architectUsdPerMonth}/mo or $${PRICING.projectPassUsdOneTime} pass`}
              </Text>
            </View>
            {isPro ? (
              <TouchableOpacity
                style={[
                  styles.upgradeBtn,
                  { backgroundColor: Theme.colors.card },
                ]}
                onPress={() => RevenueCatUI.presentCustomerCenter()}
              >
                <Text
                  style={[
                    styles.upgradeText,
                    { color: Theme.colors.text.primary },
                  ]}
                >
                  Manage
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
                <Text style={styles.upgradeText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.billingNote}>
            {isPro && subscription
              ? architectBillingChannel(subscription) === "stripe"
                ? "Your plan is billed through Stripe on the web. Manage it from the website billing page."
                : architectBillingChannel(subscription) === "store"
                  ? "Your plan is billed through the App Store. Use Manage above or Apple’s subscription settings."
                  : "In-app subscriptions use the App Store; web plans use Stripe — manage where you subscribed."
              : "In-app subscriptions are managed in the App Store. Web subscriptions use Stripe — use the same place you subscribed to change or cancel."}
          </Text>
        </GlassCard>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 200 }}
      >
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Security & Data</Text>
          <ProfileSettingItem
            testID="profile-row-ai-assistant"
            icon={
              <MessageSquare size={20} color={Theme.colors.brand.primary} />
            }
            title="AI assistant"
            subtitle="Ask questions about your project"
            onPress={() => router.push("/(tabs)/ai")}
          />
          <ProfileSettingItem
            testID="profile-row-help-support"
            icon={<HelpCircle size={20} color={Theme.colors.text.muted} />}
            title="Help & support"
            subtitle="FAQs and email"
            onPress={() => router.push("/support")}
          />
          <View
            style={styles.analyticsRow}
            accessible
            accessibilityRole="switch"
            accessibilityState={{ checked: analyticsEnabled }}
            accessibilityLabel="Optional usage analytics"
            accessibilityHint="When on, anonymous product events may be collected to improve the app"
          >
            <View style={styles.settingIcon}>
              <TrendingUp size={20} color={Theme.colors.text.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Help improve the app</Text>
              <Text style={styles.settingSubtitle}>
                Anonymous usage insights if you opt in
              </Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={(v) => void onAnalyticsToggle(v)}
              trackColor={{
                false: Theme.colors.divider,
                true: Theme.colors.brand.light,
              }}
              thumbColor={Theme.colors.card}
              ios_backgroundColor={Theme.colors.divider}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New password</Text>
            <View style={styles.inputWrapper}>
              <Lock
                size={18}
                color={Theme.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={Theme.colors.text.disabled}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm new password</Text>
            <View style={styles.inputWrapper}>
              <Lock
                size={18}
                color={Theme.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor={Theme.colors.text.disabled}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <Button
            title={passwordSaving ? "Updating…" : "Update password"}
            onPress={() => void onUpdatePasswordInApp()}
            disabled={passwordSaving || !newPassword || !confirmPassword}
            loading={passwordSaving}
            variant="outline"
            titleCase="sentence"
            style={styles.saveButton}
          />
          <ProfileSettingItem
            icon={<Lock size={20} color={Theme.colors.text.muted} />}
            title="Email me a reset link"
            subtitle="If you forgot your password"
            onPress={onEmailResetLink}
          />
          <ProfileSettingItem
            icon={<Download size={20} color={Theme.colors.text.muted} />}
            title="Export My Data"
            subtitle={
              exporting ? "Generating..." : "Backup file with all your data"
            }
            onPress={onExportData}
          />
          <ProfileSettingItem
            testID="profile-row-privacy-policy"
            icon={<Shield size={20} color={Theme.colors.text.secondary} />}
            title="Privacy Policy"
            onPress={() => router.push(WEB_APP_PATH_PRIVACY)}
          />
          <ProfileSettingItem
            testID="profile-row-terms-of-service"
            icon={<FileText size={20} color={Theme.colors.text.secondary} />}
            title="Terms of Service"
            onPress={() => router.push(WEB_APP_PATH_TERMS)}
          />
        </GlassCard>
      </MotiView>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 400 }}
        style={styles.dangerZone}
      >
        <TouchableOpacity style={styles.dangerItem} onPress={onDeleteAccount}>
          <Trash2 size={20} color={Theme.colors.status.error} />
          <Text style={styles.dangerText}>Delete My Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="profile-logout-button"
          style={styles.logoutButton}
          onPress={onSignOut}
        >
          <LogOut size={20} color={Theme.colors.text.secondary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </MotiView>

      <Text style={styles.versionText}>
        BLUPRNT Mobile v{Constants.expoConfig?.version ?? "1.0.0"} • Build{" "}
        {Constants.expoConfig?.ios?.buildNumber ??
          Constants.expoConfig?.android?.versionCode ??
          "1"}
      </Text>
    </ScreenWrapper>
  );
}
