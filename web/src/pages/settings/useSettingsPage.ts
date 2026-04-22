import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
import { supabase } from "@/lib/supabase";
import type { UserSubscriptionRow } from "@shared/types/database";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";

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

    signOutLoading,
    onSignOut,
    onBack,
  };
}
