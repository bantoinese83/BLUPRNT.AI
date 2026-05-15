import { Layout, Sun, Moon, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UIPreferences } from "@shared/types/database";

type UIPreferencesSectionProps = {
  preferences: UIPreferences | null;
  onUpdate: (prefs: Partial<UIPreferences>) => void | Promise<void>;
};

export function UIPreferencesSection({
  preferences,
  onUpdate,
}: UIPreferencesSectionProps) {
  if (!preferences) return null;

  return (
    <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <Layout className="w-5 h-5 text-teal-500" />
          Display Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Color Theme</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Customize the look and feel of your dashboard.
            </p>
          </div>

          <Tabs
            value={preferences.theme}
            onValueChange={(v) => onUpdate({ theme: v as any })}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1 rounded-2xl h-12">
              <TabsTrigger
                value="light"
                className="rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Sun className="w-4 h-4" />
                <span className="text-xs font-bold">Light</span>
              </TabsTrigger>
              <TabsTrigger
                value="dark"
                className="rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Moon className="w-4 h-4" />
                <span className="text-xs font-bold">Dark</span>
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Monitor className="w-4 h-4" />
                <span className="text-xs font-bold">System</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="border-t border-slate-100 pt-8 flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900">Compact View</h4>
            <p className="text-sm text-slate-500 font-medium">
              Show more information at once in your ledger and project lists.
            </p>
          </div>
          <Switch
            checked={preferences.compact_view}
            onCheckedChange={(checked) => onUpdate({ compact_view: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
