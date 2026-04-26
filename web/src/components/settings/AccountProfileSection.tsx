import { User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { SettingsUser } from "@/pages/settings/settings-content.types";

type AccountProfileSectionProps = {
  user: SettingsUser;
  displayName: string;
  setDisplayName: (val: string) => void;
  profileSaving: boolean;
  profileMessage: string | null;
  onSaveProfile: () => void | Promise<void>;
};

export function AccountProfileSection({
  user,
  displayName,
  setDisplayName,
  profileSaving,
  profileMessage,
  onSaveProfile,
}: AccountProfileSectionProps) {
  return (
    <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <User className="w-5 h-5 text-teal-500" />
          Account Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            void onSaveProfile();
          }}
        >
          <div className="space-y-2">
            <label
              className="text-xs font-bold text-slate-500 uppercase tracking-widest"
              htmlFor="email"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ""}
              disabled
              className="bg-slate-50/50 border-slate-200 rounded-xl"
              autoComplete="email"
            />
            <p className="text-[10px] text-slate-400 font-medium">
              Email is managed by your sign-in provider.
            </p>
          </div>
          <div className="space-y-2">
            <label
              className="text-xs font-bold text-slate-500 uppercase tracking-widest"
              htmlFor="displayName"
            >
              Display Name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl border-slate-200 focus:ring-teal-500/20"
              autoComplete="name"
            />
          </div>
          {profileMessage && (
            <p
              className={`text-sm ${profileMessage === "Saved." ? "text-teal-600 font-bold" : "text-amber-600 font-medium"}`}
            >
              {profileMessage}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto rounded-xl liquid-metal-button shadow-teal-200/50"
            disabled={profileSaving}
            type="submit"
          >
            {profileSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
