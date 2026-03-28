import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
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
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/contexts/auth-context";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { Button } from "../../src/components/ui/Button";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { useAwareness } from "../../src/contexts/AwarenessProvider";
import { supabase } from "../../src/lib/supabase";
import { router } from "expo-router";
import { MotiView } from "moti";
import { Theme } from "../../src/constants/Theme";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const { isArchitect } = useDashboardData();
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
      Alert.alert("Success", "Profile updated successfully.");
    }
  };

  const handleChangePassword = async () => {
    Haptics.selectionAsync();
    if (!user?.email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Email Sent", "Check your inbox for a password reset link.");
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isArchitect) {
      setUpgradeReason("export");
      setShowUpgrade(true);
      setExporting(false);
      return;
    }

    try {
      // Basic export logic: fetch projects and properties
      const { data: props } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_user_id", user?.id);

      const propIds = (props || []).map((p) => p.id);
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
    } catch (err) {
      Alert.alert("Export Failed", "Cloud not generate data archive.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Delete Account",
      "This action is IRREVERSIBLE. All your projects, properties, and documents will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            // In a real app, this calls an Edge Function
            Alert.alert(
              "Account Deletion",
              "For security, please contact support to complete account deletion, or use the web dashboard settings.",
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
                <Crown size={24} color={isArchitect ? "#fbbf24" : "#94a3b8"} />
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
              icon={<Lock size={20} color="#94a3b8" />}
              title="Reset Password"
              subtitle="Sent via email"
              onPress={handleChangePassword}
            />
            <SettingItem
              icon={<Download size={20} color="#94a3b8" />}
              title="Export My Data"
              subtitle={exporting ? "Generating..." : "JSON Archive"}
              onPress={handleExportData}
            />
            <SettingItem
              icon={<Shield size={20} color={Theme.colors.text.secondary} />}
              title="Privacy Policy"
              onPress={() => router.push("/privacy")}
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
            <Trash2 size={20} color="#f43f5e" />
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
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color="#334155" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    gap: 32, // More space between major sections
  },
  sectionCard: {
    padding: 20,
    borderRadius: 24,
  },
  sectionHeader: {
    fontSize: Theme.typography.size.sm,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    color: "#94a3b8",
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    height: 56, // Increased for comfort
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
    color: "white",
    fontSize: 15,
    fontFamily: "Outfit_500Medium",
  },
  saveButton: {
    marginTop: 12,
    height: 56,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  architectPlanCard: {
    backgroundColor: "rgba(251, 191, 36, 0.05)",
    borderColor: "rgba(251, 191, 36, 0.2)",
    borderWidth: 1,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  architectIcon: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  planStatus: {
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
  },
  upgradeBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Outfit_700Bold",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18, // More breathable
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: "Outfit_600SemiBold",
    color: "white",
  },
  settingSubtitle: {
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
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
    gap: 16,
    borderRadius: 16,
    backgroundColor: "rgba(244, 63, 94, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.1)",
  },
  dangerText: {
    color: "#f43f5e",
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#94a3b8",
  },
  versionText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 10,
    fontFamily: "Outfit_400Regular",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
