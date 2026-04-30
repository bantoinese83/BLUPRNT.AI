import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
import { supabase } from "@/lib/supabase";
import type { UserSubscriptionRow } from "@shared/types/database";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import { setAnalyticsEnabled as setPostHogCapturing } from "@/lib/posthog";

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
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => {
    return localStorage.getItem("bluprnt_analytics_opt_in") === "true";
  });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setUserLoading(true);
      const u = authUser;
      if (cancelled) return;
      setUser(u ?? null);
      setDisplayName((u?.user_metadata?.full_name as string) ?? "");

      if (u) {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", u.id)
          .maybeSingle();
        setSubscriptionRow(sub as UserSubscriptionRow | null);
        setIsArchitect(isArchitectPlanEffective(sub));

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
      }

      setUserLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  /** After Stripe billing portal / checkout, tab focus often returns before authUser changes — refresh plan row. */
  useEffect(() => {
    if (typeof window === "undefined" || !authUser) return;
    const refreshPlan = () => {
      void (async () => {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", authUser.id)
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
    setExportMessage(null);
    setExportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-data-export",
        {
          method: "POST",
        },
      );

      if (error) throw error;

      // Handle the binary response
      const blob = data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bluprnt-export-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setExportMessage("Download started.");
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error("Export error:", err);
      setExportMessage("Export failed. Try again.");
    } finally {
      setExportLoading(false);
    }
  }, []);

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
      const { data, error } = await supabase.functions.invoke<{
        success?: boolean;
        error?: string;
      }>("delete-account", {
        method: "POST",
      });
      if (error) throw new Error(error.message);
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

  const onAnalyticsToggle = useCallback((enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    localStorage.setItem(
      "bluprnt_analytics_opt_in",
      enabled ? "true" : "false",
    );
    setPostHogCapturing(enabled);
  }, []);

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

    analyticsEnabled,
    onAnalyticsToggle,
    isAssistantOpen,
    setIsAssistantOpen,

    signOutLoading,
    onSignOut,
    onBack,
  };
}
