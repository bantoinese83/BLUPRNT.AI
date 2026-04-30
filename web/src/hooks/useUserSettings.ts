import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { exportUserData } from "@/services/export-service";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";

export function useUserSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { full_name?: string };
  } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isArchitect, setIsArchitect] = useState(false);
  const [upgradeProjectId, setUpgradeProjectId] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const applySession = useCallback(async (u: User | null) => {
    setUser(u);
    setDisplayName((u?.user_metadata?.full_name as string) ?? "");

    if (u) {
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("status, current_period_end, revenuecat_entitlement_active")
        .eq("user_id", u.id)
        .maybeSingle();
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
      setIsArchitect(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async (u: User | null) => {
      if (cancelled) return;
      setUserLoading(true);
      try {
        await applySession(u);
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "TOKEN_REFRESHED") return;
      void run(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applySession]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    const refreshPlan = () => {
      void (async () => {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("status, current_period_end, revenuecat_entitlement_active")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsArchitect(isArchitectPlanEffective(sub));
      })();
    };
    window.addEventListener("focus", refreshPlan);
    return () => window.removeEventListener("focus", refreshPlan);
  }, [user?.id]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage(null);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() || null },
    });
    setProfileSaving(false);
    if (error) {
      toast.error(friendlyAuthError(error.message || ""));
      return;
    }
    toast.success("Profile updated");
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportMessage(null);
    setExportLoading(true);
    try {
      await exportUserData(user.id, user.email ?? "");
      toast.success("Export download started");
    } catch {
      toast.error("Export failed. Try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleChangePassword = async () => {
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
      toast.error(friendlyAuthError(error.message || ""));
      return;
    }

    toast.success("Password updated successfully");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = async (deleteConfirm: boolean) => {
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
      navigate("/", { replace: true });
    } catch (e) {
      setDeleteMessage(
        e instanceof Error ? e.message : "Couldn't delete account.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return {
    user,
    displayName,
    setDisplayName,
    profileSaving,
    profileMessage,
    exportLoading,
    exportMessage,
    deleteLoading,
    deleteMessage,
    userLoading,
    isArchitect,
    upgradeProjectId,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordSaving,
    passwordMessage,
    handleSaveProfile,
    handleExportData,
    handleChangePassword,
    handleDeleteAccount,
    handleSignOut,
  };
}
