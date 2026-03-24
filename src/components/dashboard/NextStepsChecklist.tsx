import { ArrowRight, FileText, Hammer, Share2, LucideIcon } from "lucide-react";
import { motion } from "motion/react";

type Step = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  action?: () => void;
};

export function NextStepsChecklist({
  stage,
  onAction,
}: {
  stage: string;
  onAction: (id: string) => void;
}) {
  const steps: Step[] = [];

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
        label: "Upload first quote",
        description: "Snap a photo of a contractor bid to compare.",
        icon: Hammer,
      },
      {
        id: "export-packet",
        label: "Export project brief",
        description: "Get a PDF to share with pros for bidding.",
        icon: Share2,
      },
    );
  } else {
    steps.push(
      {
        id: "upload-invoice",
        label: "Track an invoice",
        description: "Start building your verified property ledger.",
        icon: FileText,
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => onAction(step.id)}
          className="group flex flex-col items-start p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
            <step.icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
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
