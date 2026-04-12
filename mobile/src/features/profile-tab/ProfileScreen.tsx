import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Share,
} from "react-native";
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
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/auth-context";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAwareness } from "@/contexts/AwarenessContext";
import { usePremium } from "@/hooks/usePremium";
import { supabase, invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { getPasswordRecoveryRedirectUrl } from "@/lib/auth-linking";
import { router } from "expo-router";
import RevenueCatUI from "react-native-purchases-ui";
import { MotiView } from "moti";
import { Theme } from "@/constants/Theme";
import { PRICING } from "@shared/constants/pricing";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { showAppToast } from "@/lib/app-toast";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isPro } = usePremium();

  const { configurationMissing, load, subscription } = useDashboardData();
  const { setShowUpgrade, setUpgradeReason } = useAwareness();

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || "",
  );
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUpgradeReason("general");
    setShowUpgrade(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() || null },
    });

    setSaving(false);
    if (error) {
      Alert.alert(
        "Couldn’t update profile",
        friendlyAuthError(
          error.message || "",
          "status" in error ? (error as { status?: number }).status : undefined,
        ),
      );
    } else {
      showAppToast("Profile updated.");
    }
  };

  const handleChangePassword = async () => {
    Haptics.selectionAsync();
    if (!user?.email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: getPasswordRecoveryRedirectUrl(),
    });
    if (error) {
      Alert.alert(
        "Couldn’t send reset email",
        friendlyAuthError(
          error.message || "",
          "status" in error ? (error as { status?: number }).status : undefined,
        ),
      );
    } else {
      showAppToast("Check your inbox for a reset link.");
    }
  };

  const handleUpdatePasswordInApp = async () => {
    if (newPassword.length < 8) {
      Alert.alert(
        "Check password",
        "Use at least 8 characters for your new password.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Check password",
        "New password and confirmation must match.",
      );
      return;
    }
    setPasswordSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setPasswordSaving(false);
    if (error) {
      Alert.alert(
        "Couldn’t update password",
        friendlyAuthError(
          error.message || "",
          "status" in error ? (error as { status?: number }).status : undefined,
        ),
      );
    } else {
      setNewPassword("");
      setConfirmPassword("");
      showAppToast("Password updated.");
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: props } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_user_id", user?.id || "");

      const propIds = (props || []).map((p: { id: string }) => p.id);
      const { data: projs } =
        propIds.length > 0
          ? await supabase
              .from("projects")
              .select("*")
              .in("property_id", propIds)
          : { data: [] };

      const exportData = {
        exported_at: new Date().toISOString(),
        user: { email: user?.email },
        properties: props || [],
        projects: projs || [],
      };

      const json = JSON.stringify(exportData, null, 2);
      await Share.share({
        message: json,
        title: "BLUPRNT Data Export",
      });
    } catch (err: unknown) {
      reportClientError("profile_data_export", err);
      Alert.alert("Export Failed", "Couldn't generate data archive.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your projects, documents, and data will be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "Type DELETE to confirm — or tap confirm to proceed.",
              [
                { text: "Go Back", style: "cancel" },
                {
                  text: "Confirm Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const { error } = await invokeFunction("delete-account", {
                        method: "POST",
                      });
                      if (error) throw error;
                      await signOut();
                    } catch (err: unknown) {
                      reportClientError("profile_delete_account", err);
                      Alert.alert(
                        "Deletion Failed",
                        "We couldn't delete your account. Please try again or contact support.",
                      );
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  if (configurationMissing) {
    return (
      <ScreenWrapper withLogo withScroll edges={["top", "left", "right"]}>
        <ConfigurationRequired onRetry={() => void load()} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper withLogo withScroll edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Account Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
        >
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Identity</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User
                  size={18}
                  color={Theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
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
              title={saving ? "Saving..." : "Save Profile"}
              onPress={handleSaveProfile}
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
                <View
                  style={styles.duplicateSubBanner}
                  accessibilityRole="alert"
                >
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
                  {isPro ? "Bluprntai Pro" : "Free Explorer"}
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
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.billingNote}>
              {isPro && subscription
                ? architectBillingChannel(subscription) === "stripe"
                  ? "Your plan is billed through Stripe on the web. Manage it from the website billing page."
                  : architectBillingChannel(subscription) === "store"
                    ? "Your plan is billed through the App Store or Google Play. Use Manage above or your store subscriptions."
                    : "In-app subscriptions use the app store; web plans use Stripe — manage where you subscribed."
                : "In-app subscriptions are managed in the App Store or Google Play. Web subscriptions use Stripe — use the same place you subscribed to change or cancel."}
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
              icon={<HelpCircle size={20} color={Theme.colors.text.muted} />}
              title="Help & Support"
              subtitle="FAQs and contact"
              onPress={() => router.push("/support")}
            />
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
              onPress={() => void handleUpdatePasswordInApp()}
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
              onPress={handleChangePassword}
            />
            <ProfileSettingItem
              icon={<Download size={20} color={Theme.colors.text.muted} />}
              title="Export My Data"
              subtitle={exporting ? "Generating..." : "JSON Archive"}
              onPress={handleExportData}
            />
            <ProfileSettingItem
              icon={<Shield size={20} color={Theme.colors.text.secondary} />}
              title="Privacy Policy"
              onPress={() => router.push("/privacy")}
            />
            <ProfileSettingItem
              icon={<FileText size={20} color={Theme.colors.text.secondary} />}
              title="Terms of Service"
              onPress={() => router.push("/terms")}
            />
          </GlassCard>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 400 }}
          style={styles.dangerZone}
        >
          <TouchableOpacity
            style={styles.dangerItem}
            onPress={handleDeleteAccount}
          >
            <Trash2 size={20} color={Theme.colors.status.error} />
            <Text style={styles.dangerText}>Delete My Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <LogOut size={20} color={Theme.colors.text.secondary} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </MotiView>

        <Text style={styles.versionText}>BLUPRNT Mobile v1.0.4 • Build 24</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
