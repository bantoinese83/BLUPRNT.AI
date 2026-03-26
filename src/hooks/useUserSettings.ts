import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { exportUserData } from "@/services/export-service";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setUserLoading(true);
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(u);
      setDisplayName((u?.user_metadata?.full_name as string) ?? "");

      if (u) {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("status")
          .eq("user_id", u.id)
          .maybeSingle();
        setIsArchitect(sub?.status === "active");

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
      }
      setUserLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async () => {
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
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportMessage(null);
    setExportLoading(true);
    try {
      await exportUserData(user.id, user.email ?? "");
      setExportMessage("Download started.");
      setTimeout(() => setExportMessage(null), 3000);
    } catch {
      setExportMessage("Export failed. Try again.");
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
      setPasswordMessage(error.message || "Couldn't update password.");
      return;
    }

    setPasswordMessage("Success! Your password has been updated.");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMessage(null), 3000);
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
