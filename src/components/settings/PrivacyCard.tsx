import { Shield, Download, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PrivacyCardProps {
  exportLoading: boolean;
  exportMessage: string | null;
  onExport: () => void;
  deleteLoading: boolean;
  deleteMessage: string | null;
  onDelete: (confirm: boolean) => void;
}

export function PrivacyCard({
  exportLoading,
  exportMessage,
  onExport,
  deleteLoading,
  deleteMessage,
  onDelete,
}: PrivacyCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h4 className="font-medium text-slate-900">Export your data</h4>
          <p className="text-sm text-slate-600">
            Download a copy of your properties, projects, invoices, and
            documents in JSON format.
          </p>
          {exportMessage && (
            <p
              className={`text-sm ${
                exportMessage === "Download started."
                  ? "text-slate-900 font-bold"
                  : "text-amber-700 font-medium"
              }`}
            >
              {exportMessage}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onExport}
            disabled={exportLoading}
            type="button"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export data
          </Button>
        </div>
        <div className="border-t border-slate-200 pt-6 space-y-2">
          <h4 className="font-medium text-slate-900">Delete account</h4>
          <p className="text-sm text-slate-600">
            Permanently delete your account and all data. This cannot be undone.
          </p>
          <div className="flex items-center gap-1">
            <input
              id="delete-confirm"
              type="checkbox"
              checked={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.checked)}
              className="rounded border-slate-300"
            />
            <label htmlFor="delete-confirm" className="text-sm text-slate-700">
              I understand this is permanent
            </label>
          </div>
          {deleteMessage && (
            <p className="text-sm text-amber-700">{deleteMessage}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => onDelete(deleteConfirm)}
            disabled={!deleteConfirm || deleteLoading}
            type="button"
          >
            {deleteLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
