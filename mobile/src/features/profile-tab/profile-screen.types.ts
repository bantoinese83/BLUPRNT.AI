import type { User } from "@supabase/supabase-js";
import type { UserSubscriptionRow } from "@shared/types/database";

export type ProfileScreenContentProps = {
  user: User | null;
  isPro: boolean;
  subscription: UserSubscriptionRow | null;
  displayName: string;
  setDisplayName: (v: string) => void;
  saving: boolean;
  onSaveProfile: () => void | Promise<void>;
  exporting: boolean;
  onExportData: () => void | Promise<void>;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordSaving: boolean;
  onUpdatePasswordInApp: () => void | Promise<void>;
  analyticsEnabled: boolean;
  onAnalyticsToggle: (enabled: boolean) => void | Promise<void>;
  onUpgrade: () => void;
  onEmailResetLink: () => void | Promise<void>;
  onDeleteAccount: () => void;
  onSignOut: () => void;
};

export type UseProfileScreenResult = ProfileScreenContentProps & {
  configurationMissing: boolean;
  onRetryConfiguration: () => void;
};
