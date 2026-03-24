import { useState, useEffect } from "react";
import { BookOpen, FileDown, Loader2, Wrench, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { generateSellerPacketBlob } from "@/lib/pdf-export";
import { money } from "@/lib/formatters";

type ScopeItem = {
  id: string;
  category: string;
  description: string;
  total_cost_min: number | null;
  total_cost_max: number | null;
};

type InvoiceItem = {
  id: string;
  vendor_name: string | null;
  total: number | null;
  created_at: string;
  document_type?: string | null;
};

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
  invoices?: InvoiceItem[];
  onUpgradeClick?: () => void;
};

export function PropertyLedger({
  projectId,
  propertyId,
  project,
  scopeItems = [],
  invoices = [],
  onUpgradeClick,
}: PropertyLedgerProps) {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setUserId(user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const capitalTotal = invoices
    .filter((i) => {
      const t = (i.document_type ?? "invoice").toLowerCase();
      return t === "invoice" || t === "quote";
    })
    .reduce((s, i) => s + (i.total ?? 0), 0);

  const maintenanceTotal = invoices
    .filter((i) => {
      const t = (i.document_type ?? "").toLowerCase();
      return t === "warranty" || t === "permit";
    })
    .reduce((s, i) => s + (i.total ?? 0), 0);

  async function handleExportPDF() {
    if (!project || !projectId || !propertyId) {
      setMessage("Project details needed to export.");
      return;
    }
    setExporting(true);
    setMessage(null);
    try {
      const blob = await generateSellerPacketBlob(
        project,
        scopeItems,
        invoices,
      );
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const storagePath = userId
        ? `${projectId}/${userId}/seller-packet-${timestamp}.pdf`
        : `${projectId}/seller-packet-${timestamp}.pdf`;

      let savedToProject = false;
      if (userId) {
        const { error: uploadErr } = await supabase.storage
          .from("project-documents")
          .upload(storagePath, blob, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!uploadErr) {
          await supabase.from("seller_packets").upsert(
            {
              project_id: projectId,
              property_id: propertyId,
              storage_path: storagePath,
              generated_at: new Date().toISOString(),
            },
            { onConflict: "project_id" },
          );
          savedToProject = true;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `property-ledger-${project.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(
        savedToProject
          ? "Downloaded to your device. A copy is also saved with this project."
          : "Downloaded to your device. (Cloud copy wasn’t saved—try again if you need it in your account.)",
      );
    } catch {
      setMessage(
        "We couldn’t finish that. Check your connection and try again.",
      );
      onUpgradeClick?.();
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
        id="property-ledger-anchor"
        className="glass-card border-white/60 shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
          <ShieldCheck className="w-24 h-24 text-slate-400 rotate-12" />
        </div>

        <CardHeader className="pb-5 pt-7 px-6 sm:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-3 text-white shadow-2xl shadow-slate-200 ring-4 ring-white/50 flex items-center justify-center shrink-0 animate-float">
              <BookOpen className="w-7 h-7" strokeWidth={2} aria-hidden />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                Property Ledger
              </CardTitle>
              <p className="text-[12px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg uppercase tracking-widest inline-block">
                Verified Record
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-8 space-y-8 relative">
          <p className="text-base text-slate-500 leading-relaxed font-medium max-w-sm">
            Detailed history of home improvements. Export this{" "}
            <span className="text-slate-900 font-bold underline decoration-slate-300">
              Seller Packet
            </span>{" "}
            to prove value to buyers and agents.
          </p>

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
                <span className="truncate">Maintenance Log</span>
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
                {exporting ? "Generating Packet…" : "Export Seller Packet"}
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
