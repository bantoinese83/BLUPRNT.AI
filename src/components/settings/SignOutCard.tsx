import { LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SignOutCardProps {
  onSignOut: () => void;
  disabled?: boolean;
}

export function SignOutCard({ onSignOut, disabled }: SignOutCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Button
          variant="outline"
          className="w-full gap-2 text-slate-600 border-slate-200"
          onClick={onSignOut}
          disabled={disabled}
          type="button"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}
