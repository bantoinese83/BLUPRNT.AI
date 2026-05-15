import {
  ArrowRight,
  FileText,
  Hammer,
  Share2,
  TrendingUp,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import type { LedgerEntryRow } from "@shared/types/database";

type Step = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export function NextStepsChecklist({
  stage,
  ledgerEntries = [],
  onAction,
}: {
  stage: string;
  ledgerEntries?: LedgerEntryRow[];
  onAction: (id: string) => void;
}) {
  const steps: Step[] = [];

  const hasQuotes = ledgerEntries.some(
    (e: LedgerEntryRow) => e.document_type === "quote",
  );
  const hasInvoices = ledgerEntries.some(
    (e: LedgerEntryRow) => e.document_type === "invoice",
  );

  if (stage === "planning") {
    steps.push(
      {
        id: "review-scope",
        label: "Review AI Scope",
        description: "Fine-tune your line items and quantities.",
        icon: FileText,
      },
      {
        id: "upload-quote",
        label: hasQuotes ? "Compare second bid" : "Upload first quote",
        description: hasQuotes
          ? "Better data means better leverage. Snap another quote."
          : "Snap a photo of a contractor bid to compare.",
        icon: hasQuotes ? TrendingUp : Hammer,
      },
      {
        id: "export-packet",
        label: "Export seller packet",
        description:
          "Download the full ledger PDF—scope, plan vs spend, and costs.",
        icon: Share2,
      },
    );
  } else {
    steps.push(
      {
        id: "upload-document",
        label: hasInvoices ? "Verify another invoice" : "Add a ledger entry",
        description: hasInvoices
          ? "Keep your property's value documentation growing."
          : "Start building your property ledger.",
        icon: hasInvoices ? ShieldCheck : FileText,
      },
      {
        id: "review-health",
        label: "Check project health",
        description: "See if you're staying within your baseline.",
        icon: Hammer,
      },
      {
        id: "share-access",
        label: "Share with partner",
        description: "Invite someone to view the project records.",
        icon: Share2,
      },
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {steps.map((step, i) => (
        <motion.button
          key={step.id}
          type="button"
          aria-label={step.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => onAction(step.id)}
          className="group flex flex-col items-start p-5 rounded-3xl bg-white border border-slate-200 shadow-drop-sm hover:border-teal-200 hover:shadow-drop-md active:scale-[0.99] transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-teal-50 transition-colors">
            <step.icon className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
            {step.label}
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {step.description}
          </p>
        </motion.button>
      ))}
    </div>
  );
}
