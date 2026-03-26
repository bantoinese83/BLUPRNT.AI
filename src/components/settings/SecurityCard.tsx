import { Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SecurityCardProps {
  email?: string;
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  passwordSaving: boolean;
  passwordMessage: string | null;
  onUpdate: () => void;
}

export function SecurityCard({
  email,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordSaving,
  passwordMessage,
  onUpdate,
}: SecurityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onUpdate();
          }}
        >
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">
              Change password
            </h4>
            <p className="text-xs text-slate-500">
              Update your account password.
            </p>
          </div>

          <input
            type="text"
            name="username"
            autoComplete="email"
            value={email ?? ""}
            readOnly
            className="hidden"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
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
                className="h-10"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
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
                className="h-10"
                autoComplete="new-password"
              />
            </div>
          </div>

          {passwordMessage && (
            <p
              className={`text-sm ${
                passwordMessage.includes("Success")
                  ? "text-slate-900 font-bold"
                  : "text-amber-700 font-medium"
              }`}
            >
              {passwordMessage}
            </p>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={passwordSaving || !newPassword}
            type="submit"
            className="w-full sm:w-auto"
          >
            {passwordSaving && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
