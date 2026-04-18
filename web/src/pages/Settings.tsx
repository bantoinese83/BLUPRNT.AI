import { PageLoader } from "@/components/PageLoader";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SettingsContent } from "@/pages/settings/SettingsContent";
import { SettingsSupabaseNotConfiguredView } from "@/pages/settings/SettingsEarlyViews";
import { useSettingsPage } from "@/pages/settings/useSettingsPage";

export default function Settings() {
  const { userLoading, ...contentProps } = useSettingsPage();

  if (!isSupabaseConfigured()) {
    return <SettingsSupabaseNotConfiguredView />;
  }

  if (userLoading) {
    return <PageLoader />;
  }

  return <SettingsContent {...contentProps} />;
}
