import React, { useState } from "react";
import {
  StyleSheet,
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
  ChevronRight,
  Mail,
  Crown,
  FileText,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/contexts/auth-context";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { Button } from "../../src/components/ui/Button";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { useAwareness } from "../../src/contexts/AwarenessContext";
import { supabase, invokeFunction } from "../../src/lib/supabase";
import { router } from "expo-router";
import { MotiView } from "moti";
import { Theme } from "../../src/constants/Theme";
import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "./_layout";
import { ConfigurationRequired } from "../../src/components/ConfigurationRequired";
import { showAppToast } from "../../src/lib/app-toast";

const TAB_BAR_OFFSET = TAB_BAR_HEIGHT + TAB_BAR_MARGIN + 20;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const { isArchitect, configurationMissing, load } = useDashboardData();
  const { setShowUpgrade, setUpgradeReason } = useAwareness();

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || "",
  );
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      Alert.alert("Error", error.message);
    } else {
      showAppToast("Profile updated.");
    }
  };

  const handleChangePassword = async () => {
    Haptics.selectionAsync();
    if (!user?.email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      showAppToast("Check your inbox for a reset link.");
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: props } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_user_id", user?.id);

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
    } catch (_) {
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
                    } catch (_err) {
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
        {/* Profile Section */}
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

        {/* Plan Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 100 }}
        >
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Membership</Text>
            <View
              style={[styles.planCard, isArchitect && styles.architectPlanCard]}
            >
              <View
                style={[styles.planIcon, isArchitect && styles.architectIcon]}
              >
                <Crown
                  size={24}
                  color={
                    isArchitect
                      ? Theme.colors.status.warning
                      : Theme.colors.text.muted
                  }
                />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>
                  {isArchitect ? "Architect Member" : "Free Explorer"}
                </Text>
                <Text style={styles.planStatus}>
                  {isArchitect
                    ? "Premium AI insights enabled"
                    : "Standard benchmarks active"}
                </Text>
              </View>
              {!isArchitect && (
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        </MotiView>

        {/* Security / Privacy */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 200 }}
        >
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Security & Data</Text>
            <SettingItem
              icon={<Lock size={20} color={Theme.colors.text.muted} />}
              title="Reset Password"
              subtitle="Sent via email"
              onPress={handleChangePassword}
            />
            <SettingItem
              icon={<Download size={20} color={Theme.colors.text.muted} />}
              title="Export My Data"
              subtitle={exporting ? "Generating..." : "JSON Archive"}
              onPress={handleExportData}
            />
            <SettingItem
              icon={<Shield size={20} color={Theme.colors.text.secondary} />}
              title="Privacy Policy"
              onPress={() => router.push("/privacy")}
            />
            <SettingItem
              icon={<FileText size={20} color={Theme.colors.text.secondary} />}
              title="Terms of Service"
              onPress={() => router.push("/terms")}
            />
          </GlassCard>
        </MotiView>

        {/* Danger Zone */}
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

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color={Theme.colors.text.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.typography.size.display,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -1,
  },
  scrollContent: {
    padding: Theme.spacing.xl,
    paddingBottom: TAB_BAR_OFFSET + 40,
    gap: Theme.spacing.xxl,
  },
  sectionCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
  },
  sectionHeader: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: Theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: 12,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.muted,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    height: 56,
    paddingHorizontal: 16,
  },
  disabledInput: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderColor: "transparent",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.medium,
  },
  saveButton: {
    marginTop: Theme.spacing.sm,
    height: 56,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    padding: 16,
    borderRadius: Theme.radius.lg,
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  architectPlanCard: {
    backgroundColor: "rgba(245, 158, 11, 0.04)",
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderWidth: 1,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  architectIcon: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  planStatus: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  upgradeBtn: {
    backgroundColor: Theme.colors.brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 10, // Better touch target
    borderRadius: Theme.radius.sm,
  },
  upgradeText: {
    color: "white",
    fontSize: Theme.typography.size.sm,
    fontFamily: Theme.typography.family.bold,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  settingIcon: {
    width: 44, // Matched touch target
    height: 44,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  settingTitle: {
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
  settingSubtitle: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  dangerZone: {
    marginTop: 10,
    gap: 12,
  },
  dangerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
    backgroundColor: "rgba(244, 63, 94, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.1)",
  },
  dangerText: {
    color: Theme.colors.status.error,
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.black,
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
  },
  logoutText: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
  },
  versionText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
