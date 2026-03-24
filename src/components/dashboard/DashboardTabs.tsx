import { NavLink, useLocation } from "react-router-dom";
import { ClipboardList, Hammer, FileText } from "lucide-react";
import { motion } from "motion/react";

const tabs = [
  {
    to: "/dashboard/plan",
    label: "Plan",
    subtitle: "Budget & scope",
    icon: ClipboardList,
  },
  {
    to: "/dashboard/execute",
    label: "Execute",
    subtitle: "Track invoices",
    icon: Hammer,
  },
  {
    to: "/dashboard/record",
    label: "Record",
    subtitle: "Seller packet",
    icon: FileText,
  },
] as const;

export function DashboardTabs() {
  const location = useLocation();
  return (
    <nav
      role="tablist"
      aria-label="Project phases"
      className="glass flex rounded-2xl p-1.5 gap-1 shadow-sm border-white/40 mb-2 relative"
    >
      {tabs.map(({ to, label, subtitle, icon: Icon }) => {
        const isActive =
          location.pathname === to || location.pathname.startsWith(`${to}/`);
        return (
          <NavLink
            key={to}
            to={to}
            role="tab"
            aria-selected={isActive}
            className={() =>
              `relative flex flex-1 items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 isolate ${
                isActive
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`
            }
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-xl shadow-lg shadow-slate-100/50 border border-slate-100/50 -z-10"
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              />
            )}
            <Icon
              className={`w-4.5 h-4.5 shrink-0 transition-colors duration-300 ${isActive ? "text-slate-900" : "text-slate-400"}`}
              strokeWidth={isActive ? 2.5 : 2}
              aria-hidden
            />
            <span className="hidden sm:inline">
              {label}
              <span
                className={`ml-2 text-[10px] font-bold uppercase tracking-wider opacity-60 transition-colors ${isActive ? "text-slate-500" : "text-slate-400"}`}
              >
                {subtitle}
              </span>
            </span>
            <span className="sm:hidden">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
