import { useState } from "react";
import { BookOpen, FileDown, Loader2, Wrench, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadSellerPacket } from "@/lib/seller-packet-download";
import type { LedgerEntryRow } from "@shared/types/database";
import { money } from "@/lib/formatters";
import {
  capitalImprovementTotal,
  maintenanceDocumentTotal,
} from "@/lib/plan-vs-actual";

type ScopeItem = {
  id: string;
  category: string;
  description: string;
  total_cost_min: number | null;
  total_cost_max: number | null;
};

type LedgerEntryItem = Pick<
  LedgerEntryRow,
  | "id"
  | "vendor_name"
  | "total"
  | "created_at"
  | "document_type"
  | "document_id"
>;

type ProjectInfo = {
  name: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
};

type PropertyLedgerProps = {
  projectId?: string;
  propertyId?: string;
  project?: ProjectInfo;
  scopeItems?: ScopeItem[];
  ledgerEntries?: LedgerEntryItem[];
  /** Full seller packet export requires Architect or Project Pass (same as mobile). */
  canExportSellerPacket?: boolean;
  onExportNotAllowed?: () => void;
};

export function PropertyLedger({
  projectId,
  propertyId,
  project,
  scopeItems = [],
  ledgerEntries = [],
  canExportSellerPacket = false,
  onExportNotAllowed,
}: PropertyLedgerProps) {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [includeOriginalAppendix, setIncludeOriginalAppendix] = useState(false);

  const capitalTotal = capitalImprovementTotal(ledgerEntries);
  const maintenanceTotal = maintenanceDocumentTotal(ledgerEntries);

  async function handleExportPDF() {
    if (!project || !projectId || !propertyId) {
      setMessage("Project details needed to export.");
      return;
    }
    if (!canExportSellerPacket) {
      onExportNotAllowed?.();
      return;
    }
    setExporting(true);
    setMessage(null);
    try {
      const scopeForPdf = scopeItems.map(
        ({ category, description, total_cost_min, total_cost_max }) => ({
          category,
          description,
          total_cost_min,
          total_cost_max,
        }),
      );
      const { savedToProject } = await downloadSellerPacket({
        projectId,
        propertyId,
        project,
        scopeItems: scopeForPdf,
        invoices: ledgerEntries as LedgerEntryRow[],
        includeAppendix: includeOriginalAppendix,
      });
      setMessage(
        savedToProject
          ? "Downloaded to your device. A copy is also saved with this project."
          : "Downloaded to your device. (Cloud copy wasn’t saved—try again if you need it in your account.)",
      );
    } catch {
      setMessage(
        "We couldn’t finish that. Check your connection and try again.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="scroll-mt-24"
    >
      <Card
        id="document-vault-anchor"
        className="glass-card border-white/60 shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
          <ShieldCheck className="w-24 h-24 text-slate-400 rotate-12" />
        </div>

        <CardHeader className="pb-5 pt-7 px-6 sm:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-teal-950 to-teal-900 p-3 text-white shadow-2xl shadow-teal-900/20 ring-4 ring-white/50 flex items-center justify-center shrink-0 animate-float">
              <BookOpen className="w-7 h-7" strokeWidth={2} aria-hidden />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                Document Vault
              </CardTitle>
              <p className="text-[12px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg uppercase tracking-widest inline-block">
                Permanent records
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-8 space-y-8 relative">
          <p className="text-base text-slate-500 leading-relaxed font-medium max-w-sm">
            Your estimate, build tracker, and all permanent project records—in
            one secure PDF. Optionally include receipt photos from linked
            uploads below. Export the{" "}
            <span className="text-slate-900 font-bold underline decoration-slate-300">
              Home Archive
            </span>{" "}
            so future buyers see a clear, verified story of this property.
          </p>

          <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-slate-200/80 bg-white/50 p-4 text-left hover:bg-white/80 transition-colors">
            <input
              type="checkbox"
              checked={includeOriginalAppendix}
              onChange={(e) => setIncludeOriginalAppendix(e.target.checked)}
              disabled={exporting || ledgerEntries.every((i) => !i.document_id)}
              className="mt-1 size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            <span className="text-sm text-slate-600 leading-snug">
              <span className="font-semibold text-slate-900 block mb-0.5">
                Include uploads in PDF
              </span>
              {ledgerEntries.every((i) => !i.document_id) ? (
                <>
                  Available after you attach a photo or file to at least one
                  document. Nothing is linked yet, so this stays off.
                </>
              ) : (
                <>
                  Adds receipt photos at the end of your Home Archive. If a
                  document is a PDF, we add a short note instead of the full
                  file. Larger download — only turn on if you are comfortable
                  sharing those images.
                </>
              )}
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-bold text-slate-400">
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/50">
              <span className="text-slate-900 block mb-1 uppercase text-[8.5px] tracking-tighter leading-tight font-black">
                Capital Improvements
              </span>
              <span className="font-medium text-slate-500 normal-case tracking-normal">
                Increases your home's cost basis (Tax Advantage).
              </span>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/50">
              <span className="text-slate-900 block mb-1 uppercase text-[8.5px] tracking-tighter leading-tight font-black">
                Project records
              </span>
              <span className="font-medium text-slate-500 normal-case tracking-normal">
                Permits, warranties, inspections, liens, &amp; compliance files.
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all duration-300 hover:bg-slate-100/50 hover:border-slate-200 gap-3">
              <div className="text-sm font-bold text-slate-600 flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                </div>
                <span className="truncate">Capital Improvements</span>
              </div>
              <span className="font-bold text-slate-950 tabular-nums text-lg tracking-tight shrink-0">
                {money(capitalTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all duration-300 hover:bg-slate-100/50 hover:border-slate-200 gap-3">
              <div className="text-sm font-bold text-slate-600 flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                </div>
                <span className="truncate">Project records</span>
              </div>
              <span className="font-bold text-slate-950 tabular-nums text-lg tracking-tight shrink-0">
                {money(maintenanceTotal)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              className="w-full h-auto gap-2.5 rounded-2xl py-5 px-4 font-bold text-base shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] premium-gradient border-0 text-white flex items-center justify-center leading-tight overflow-visible"
              onClick={handleExportPDF}
              disabled={exporting || !project}
              type="button"
            >
              {exporting ? (
                <Loader2
                  className="w-5 h-5 shrink-0 animate-spin"
                  aria-hidden
                />
              ) : (
                <FileDown className="w-5 h-5 shrink-0" aria-hidden />
              )}
              <span className="whitespace-nowrap">
                {exporting ? "Generating Archive…" : "Export Home Archive"}
              </span>
            </Button>
            {message && (
              <p className="mt-4 text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                {message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
