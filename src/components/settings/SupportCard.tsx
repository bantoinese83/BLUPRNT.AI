import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SupportCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <HelpCircle className="w-5 h-5" />
          Help & Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Got a question, need help with an estimate, or have an idea for a new
          feature? We're here to help you get the most out of BLUPRNT.AI.
        </p>
        <a href="mailto:connect@monarch-labs.com" className="inline-block">
          <Button
            variant="outline"
            className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            type="button"
          >
            Message our support team
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
