import { Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { SettingsUser } from "@/pages/settings/settings-content.types";

type SecuritySectionProps = {
  user: SettingsUser;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  passwordSaving: boolean;
  passwordMessage: string | null;
  onChangePassword: () => void | Promise<void>;
};

export function SecuritySection({
  user,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordSaving,
  passwordMessage,
  onChangePassword,
}: SecuritySectionProps) {
  if (!user?.email) return null;

  return (
    <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <Shield className="w-5 h-5 text-teal-500" />
          Security & Password
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            void onChangePassword();
          }}
        >
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Update Password
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Ensure your account is using a long, random password to stay
              secure.
            </p>
          </div>

          <input
            type="text"
            name="username"
            autoComplete="email"
            value={user.email}
            readOnly
            className="hidden"
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"
                htmlFor="new-password"
              >
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-xl border-slate-200"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"
                htmlFor="confirm-password"
              >
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl border-slate-200"
                autoComplete="new-password"
              />
            </div>
          </div>

          {passwordMessage && (
            <p
              className={`text-sm ${passwordMessage.includes("Success") ? "text-teal-600 font-bold" : "text-amber-600 font-medium"}`}
            >
              {passwordMessage}
            </p>
          )}

          <Button
            variant="outline"
            size="lg"
            disabled={passwordSaving || !newPassword}
            type="submit"
            className="w-full sm:w-auto rounded-xl border-slate-200 hover:bg-slate-50"
          >
            {passwordSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
