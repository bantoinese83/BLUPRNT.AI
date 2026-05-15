import { Bell, Mail, Smartphone, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NotificationPreferences } from "@shared/types/database";

type NotificationsSectionProps = {
  preferences: NotificationPreferences | null;
  onUpdate: (prefs: Partial<NotificationPreferences>) => void | Promise<void>;
};

export function NotificationsSection({
  preferences,
  onUpdate,
}: NotificationsSectionProps) {
  if (!preferences) return null;

  return (
    <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <Bell className="w-5 h-5 text-teal-500" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-900">Budget Alerts</h4>
              <p className="text-sm text-slate-500 font-medium">
                Get notified when your project spend exceeds 90% of your
                estimate.
              </p>
            </div>
            <Switch
              checked={preferences.budget_alerts}
              onCheckedChange={(checked) =>
                onUpdate({ budget_alerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-900">OCR & Processing</h4>
              <p className="text-sm text-slate-500 font-medium">
                Receive updates when your uploaded documents are finished
                processing.
              </p>
            </div>
            <Switch
              checked={preferences.ocr_completion}
              onCheckedChange={(checked) =>
                onUpdate({ ocr_completion: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-900">Marketing & Insights</h4>
              <p className="text-sm text-slate-500 font-medium">
                Periodic tips on renovation strategy and anonymous usage
                sharing.
              </p>
            </div>
            <Switch
              checked={preferences.marketing}
              onCheckedChange={(checked) => onUpdate({ marketing: checked })}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Delivery Channel</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Choose how you prefer to receive these notifications.
            </p>
          </div>

          <Tabs
            value={preferences.preferred_channel}
            onValueChange={(v) => onUpdate({ preferred_channel: v as any })}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1 rounded-2xl h-12">
              <TabsTrigger
                value="email"
                className="rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span className="text-xs font-bold">Email</span>
              </TabsTrigger>
              <TabsTrigger
                value="push"
                className="rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-xs font-bold">Push</span>
              </TabsTrigger>
              <TabsTrigger
                value="both"
                className="rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold">Both</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
