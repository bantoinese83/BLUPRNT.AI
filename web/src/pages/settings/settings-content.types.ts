import type { UserSubscriptionRow } from "@shared/types/database";

export type SettingsUser = {
  email?: string;
  user_metadata?: { full_name?: string };
} | null;

export type SettingsContentProps = {
  user: SettingsUser;
  displayName: string;
  setDisplayName: (v: string) => void;
  profileSaving: boolean;
  profileMessage: string | null;
  onSaveProfile: () => void | Promise<void>;

  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordSaving: boolean;
  passwordMessage: string | null;
  onChangePassword: () => void | Promise<void>;

  exportMessage: string | null;
  exportLoading: boolean;
  onExportData: () => void | Promise<void>;

  deleteMessage: string | null;
  deleteConfirm: boolean;
  setDeleteConfirm: (v: boolean) => void;
  deleteLoading: boolean;
  onDeleteAccount: () => void | Promise<void>;

  isArchitect: boolean;
  subscriptionRow: UserSubscriptionRow | null;
  showUpgrade: boolean;
  setShowUpgrade: (v: boolean) => void;
  upgradeProjectId: string | null;

  signOutLoading: boolean;
  onSignOut: () => void | Promise<void>;
  onBack: () => void;
};

export type UseSettingsPageResult = SettingsContentProps & {
  userLoading: boolean;
};
