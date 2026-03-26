import { User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProfileCardProps {
  email?: string;
  displayName: string;
  setDisplayName: (name: string) => void;
  profileSaving: boolean;
  profileMessage: string | null;
  onSave: () => void;
}

export function ProfileCard({
  email,
  displayName,
  setDisplayName,
  profileSaving,
  profileMessage,
  onSave,
}: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email ?? ""}
              disabled
              className="bg-slate-50"
              autoComplete="email"
            />
            <p className="text-xs text-slate-500">
              Email is managed by your sign-in provider. Contact support to
              change it.
            </p>
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="displayName"
            >
              Display name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>
          {profileMessage && (
            <p
              className={`text-sm ${
                profileMessage === "Saved."
                  ? "text-slate-900 font-bold"
                  : "text-amber-700 font-medium"
              }`}
            >
              {profileMessage}
            </p>
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={profileSaving}
            type="submit"
          >
            {profileSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
