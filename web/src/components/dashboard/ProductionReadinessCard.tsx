import {
  ShieldCheck,
  PhoneCall,
  Hammer,
  Wrench,
  Banknote,
  Gavel,
  ChevronRight,
  Info,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { itemVariants } from "@/lib/animations";

interface ReadinessItemProps {
  icon: LucideIcon;
  title: string;
  status: "ready" | "pending" | "warning";
  description: string;
  index: number;
}

function ReadinessItem({
  icon: Icon,
  title,
  status,
  description,
  index,
}: ReadinessItemProps) {
  const statusColors = {
    ready: "bg-emerald-50 text-emerald-600 border-emerald-100",
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    warning: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const dotColors = {
    ready: "bg-emerald-500",
    pending: "bg-amber-500",
    warning: "bg-rose-500",
  };

  return (
    <motion.div
      variants={itemVariants}
      custom={index}
      className="flex items-center gap-4 group cursor-default"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${statusColors[status]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-slate-900">{title}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
        </div>
        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

interface Props {
  documentCount: number;
  hasQuotes: boolean;
  hasInvoices: boolean;
  onPressAudit?: () => void;
}

export function ProductionReadinessCard({
  documentCount,
  hasQuotes,
  hasInvoices,
  onPressAudit,
}: Props) {
  const readinessItems: Omit<ReadinessItemProps, "index">[] = [
    {
      icon: PhoneCall,
      title: "Maintenance Registry",
      status: hasInvoices ? "ready" : "pending",
      description: hasInvoices
        ? "Primary service team documented"
        : "No contractors on speed dial yet",
    },
    {
      icon: Hammer,
      title: "Usage Durability",
      status: hasQuotes ? "ready" : "warning",
      description: hasQuotes
        ? "Material specs verified for high-traffic"
        : "Incomplete material performance data",
    },
    {
      icon: Wrench,
      title: "Legacy Maintenance",
      status: documentCount > 2 ? "ready" : "pending",
      description:
        documentCount > 2
          ? "Warranties and parts indexed"
          : "Maintenance tech-debt accumulating",
    },
    {
      icon: Banknote,
      title: "Operational Efficiency",
      status: hasInvoices ? "ready" : "pending",
      description: hasInvoices
        ? "Utility ROI tracking active"
        : "Budget leak detection inactive",
    },
    {
      icon: Gavel,
      title: "Liability & Shield",
      status: documentCount > 5 ? "ready" : "warning",
      description:
        documentCount > 5
          ? "Permits and RLS policies verified"
          : "Security & compliance gaps found",
    },
  ];

  const readyCount = readinessItems.filter((i) => i.status === "ready").length;
  const score = Math.round((readyCount / readinessItems.length) * 100);

  return (
    <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-4xl p-6 sm:p-8 shadow-drop-lg">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-1">
            Estate Audit
          </h5>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Production Readiness
          </h3>
        </div>
        <div className="bg-teal-600 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm">
          {score}%
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-8 flex-1">
        {readinessItems.map((item, idx) => (
          <ReadinessItem key={item.title} {...item} index={idx} />
        ))}
      </div>

      <div className="space-y-5">
        <button
          onClick={onPressAudit}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white px-5 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-drop-md transition-all active:scale-[0.98] group text-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Run Readiness Audit</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <div className="flex items-start gap-3 px-1">
          <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
            Modeled after industry standards to ensure your home is resilient,
            documented, and investment-grade.
          </p>
        </div>
      </div>
    </div>
  );
}
