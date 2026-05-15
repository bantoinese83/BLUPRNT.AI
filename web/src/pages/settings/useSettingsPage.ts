import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
import { supabase, invokeFunction } from "@/lib/supabase";
import type {
  UserSubscriptionRow,
  NotificationPreferences,
  UIPreferences,
} from "@shared/types/database";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import { setAnalyticsEnabled as setPostHogCapturing } from "@/lib/posthog";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing.js";

import type {
  SettingsUser,
  UseSettingsPageResult,
} from "./settings-content.types";

export function useSettingsPage(): UseSettingsPageResult {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { logout } = useLogout();
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [user, setUser] = useState<SettingsUser>(null);
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
  const [subscriptionRow, setSubscriptionRow] =
    useState<UserSubscriptionRow | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeProjectId, setUpgradeProjectId] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences | null>(null);
  const [uiPreferences, setUiPreferences] = useState<UIPreferences | null>(
    null,
  );
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setUserLoading(true);
      try {
        const u = authUser;
        if (cancelled) return;
        setUser(u ?? null);
        setDisplayName((u?.user_metadata?.full_name as string) ?? "");

        if (u) {
          // Parallel fetch for sub and prefs
          const [{ data: sub }, { data: prefs }] = await Promise.all([
            supabase
              .from("user_subscriptions")
              .select("*")
              .eq("user_id", u.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("user_preferences")
              .select("notification_preferences, ui_preferences")
              .eq("user_id", u.id)
              .maybeSingle(),
          ]);

          if (cancelled) return;

          setSubscriptionRow(sub as UserSubscriptionRow | null);
          setIsArchitect(isArchitectPlanEffective(sub));

          if (prefs) {
            setNotificationPreferences(
              prefs.notification_preferences as NotificationPreferences,
            );
            setUiPreferences(prefs.ui_preferences as UIPreferences);
            // Sync analytics setting to PostHog
            setPostHogCapturing(
              (prefs.notification_preferences as NotificationPreferences)
                ?.marketing ?? false,
            );
          }

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
          setSubscriptionRow(null);
          setIsArchitect(false);
          setNotificationPreferences(null);
          setUiPreferences(null);
        }
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const onUpdateNotifications = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!authUser) return;
      const newPrefs = { ...notificationPreferences, ...prefs };
      setNotificationPreferences(newPrefs as NotificationPreferences);

      const { error } = await supabase.from("user_preferences").upsert({
        user_id: authUser.id,
        notification_preferences: newPrefs,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to save notification preferences:", error);
      } else if (prefs.marketing !== undefined) {
        setPostHogCapturing(prefs.marketing);
      }
    },
    [authUser, notificationPreferences],
  );

  const onUpdateUI = useCallback(
    async (prefs: Partial<UIPreferences>) => {
      if (!authUser) return;
      const newPrefs = { ...uiPreferences, ...prefs };
      setUiPreferences(newPrefs as UIPreferences);

      const { error } = await supabase.from("user_preferences").upsert({
        user_id: authUser.id,
        ui_preferences: newPrefs,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to save UI preferences:", error);
      }
    },
    [authUser, uiPreferences],
  );

  /** After Stripe billing portal / checkout, tab focus often returns before authUser changes — refresh plan row. */
  useEffect(() => {
    if (typeof window === "undefined" || !authUser) return;
    const refreshPlan = () => {
      void (async () => {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", authUser.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setSubscriptionRow(sub as UserSubscriptionRow | null);
        setIsArchitect(isArchitectPlanEffective(sub));
      })();
    };
    window.addEventListener("focus", refreshPlan);
    return () => window.removeEventListener("focus", refreshPlan);
  }, [authUser]);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const onSignOut = useCallback(async () => {
    setSignOutLoading(true);
    await logout();
    setSignOutLoading(false);
  }, [logout]);

  const onSaveProfile = useCallback(async () => {
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
  }, [displayName]);

  const onExportData = useCallback(async () => {
    if (exportLoading) return;
    setExportMessage(null);
    setExportLoading(true);
    try {
      const { data, error } = await invokeFunction(
        EDGE_FUNCTIONS.GENERATE_DATA_EXPORT,
        { method: "POST" },
      );

      if (error) throw error;

      if (!data) {
        throw new Error("No data received from export function.");
      }

      // In browser, supabase-js returns application/zip as a Blob
      const blob =
        data instanceof Blob
          ? data
          : new Blob([data as BlobPart], {
              type: "application/zip",
            });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bluprnt-export-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage("Download started.");
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error("Export error:", err);
      setExportMessage("Export failed. Try again.");
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading]);

  const onChangePassword = useCallback(async () => {
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
  }, [newPassword, confirmPassword]);

  const onDeleteAccount = useCallback(async () => {
    if (!deleteConfirm) return;
    setDeleteMessage(null);
    setDeleteLoading(true);
    try {
      const { data, error } = await invokeFunction<{
        success?: boolean;
        error?: string;
      }>(EDGE_FUNCTIONS.DELETE_ACCOUNT, {
        method: "POST",
      });
      if (error) {
        const msg =
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message?: string }).message ?? "")
            : "";
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      await supabase.auth.signOut();
      navigate("/signed-out", { replace: true });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setDeleteMessage(
        raw
          ? friendlyAuthError(raw)
          : "Something went wrong. Please try again or contact support.",
      );
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteConfirm, navigate]);

  return {
    userLoading,
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

    notificationPreferences,
    onUpdateNotifications,
    uiPreferences,
    onUpdateUI,

    isAssistantOpen,
    setIsAssistantOpen,

    signOutLoading,
    onSignOut,
    onBack,
  };
}
