import { useState, useEffect, useCallback } from "react";
import { Alert, Share } from "react-native";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/contexts/auth-context";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAwareness } from "@/contexts/AwarenessContext";
import { usePremium } from "@/hooks/usePremium";
import { supabase, invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { getPasswordRecoveryRedirectUrl } from "@/lib/auth-linking";
import { showAppToast } from "@/lib/app-toast";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import {
  getProductAnalyticsConsent,
  setProductAnalyticsConsent,
} from "@/lib/product-analytics";

import type { UseProfileScreenResult } from "./profile-screen.types";

export function useProfileScreen(): UseProfileScreenResult {
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
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    void getProductAnalyticsConsent().then(setAnalyticsEnabled);
  }, []);

  const onAnalyticsToggle = useCallback(async (enabled: boolean) => {
    void Haptics.selectionAsync();
    setAnalyticsEnabled(enabled);
    await setProductAnalyticsConsent(enabled);
  }, []);

  const onUpgrade = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUpgradeReason("general");
    setShowUpgrade(true);
  }, [setShowUpgrade, setUpgradeReason]);

  const onSaveProfile = useCallback(async () => {
    setSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
      showAppToast("Profile updated.", { type: "success" });
    }
  }, [displayName]);

  const onEmailResetLink = useCallback(async () => {
    void Haptics.selectionAsync();
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
      showAppToast("Check your inbox for a reset link.", { type: "success" });
    }
  }, [user?.email]);

  const onUpdatePasswordInApp = useCallback(async () => {
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      showAppToast("Password updated.", { type: "success" });
    }
  }, [newPassword, confirmPassword]);

  const onExportData = useCallback(async () => {
    setExporting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
  }, [user?.email, user?.id]);

  const onDeleteAccount = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
  }, [signOut]);

  const onSignOut = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  }, [signOut]);

  const onRetryConfiguration = useCallback(() => {
    void load();
  }, [load]);

  return {
    configurationMissing,
    onRetryConfiguration,
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
  };
}
