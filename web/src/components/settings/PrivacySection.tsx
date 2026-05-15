import { Shield, Download, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PrivacySectionProps = {
  exportMessage: string | null;
  exportLoading: boolean;
  onExportData: () => void | Promise<void>;
  deleteConfirm: boolean;
  setDeleteConfirm: (val: boolean) => void;
  deleteMessage: string | null;
  deleteLoading: boolean;
  onDeleteAccount: () => void | Promise<void>;
};

export function PrivacySection({
  exportMessage,
  exportLoading,
  onExportData,
  deleteConfirm,
  setDeleteConfirm,
  deleteMessage,
  deleteLoading,
  onDeleteAccount,
}: PrivacySectionProps) {
  return (
    <Card className="glass border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <Shield className="w-5 h-5 text-teal-500" />
          Data & Privacy
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Export Project Data</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Download a single file with your properties, projects, scope, and
              documents—useful for backups or moving your data.
            </p>
          </div>
          {exportMessage && (
            <p
              className={`text-sm ${exportMessage === "Download started." ? "text-teal-600 font-bold" : "text-amber-600 font-medium"}`}
            >
              {exportMessage}
            </p>
          )}
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
            onClick={() => void onExportData()}
            disabled={exportLoading}
            type="button"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Generate Export
          </Button>
        </div>

        <div className="border-t border-slate-100 pt-8 space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              Danger Zone
            </h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Permanently delete your account and all associated data. This
              action is immediate and IRREVERSIBLE.
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
            <input
              id="delete-confirm"
              type="checkbox"
              checked={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.checked)}
              className="w-4 h-4 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label
              htmlFor="delete-confirm"
              className="text-sm text-slate-700 font-bold select-none cursor-pointer"
            >
              I understand this is permanent
            </label>
          </div>
          {deleteMessage && (
            <p className="text-sm text-amber-700 font-bold px-1">
              {deleteMessage}
            </p>
          )}
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-xl"
            onClick={() => void onDeleteAccount()}
            disabled={!deleteConfirm || deleteLoading}
            type="button"
          >
            {deleteLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete My Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
