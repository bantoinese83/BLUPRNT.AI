import { AppSlimFooter } from "@/components/layout/AppSlimFooter";

export function SettingsSupabaseNotConfiguredView() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-slate-600">
          Connect your account to manage settings.
        </p>
      </div>
      <AppSlimFooter className="bg-white/80" />
    </div>
  );
}
