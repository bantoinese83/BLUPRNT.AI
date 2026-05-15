import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  ShieldCheck,
  History,
  FileText,
} from "lucide-react";

const MENU_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    anchor: "dashboard-stats-anchor",
  },
  {
    id: "health",
    label: "Health",
    icon: Activity,
    anchor: "project-health-anchor",
  },
  {
    id: "resale",
    label: "Resale",
    icon: TrendingUp,
    anchor: "resale-impact-anchor",
  },
  {
    id: "readiness",
    label: "Readiness",
    icon: ShieldCheck,
    anchor: "production-readiness-anchor",
  },
  {
    id: "vault",
    label: "Vault",
    icon: FileText,
    anchor: "document-vault-anchor",
  },
  {
    id: "activity",
    label: "Activity",
    icon: History,
    anchor: "activity-feed-anchor",
  },
];

export function DashboardJumpMenu() {
  const [activeId, setActiveId] = useState("overview");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setVisible(scrollY > 400);

      // Simple intersection observer-like logic for active state
      for (const item of [...MENU_ITEMS].reverse()) {
        const element = document.getElementById(item.anchor);
        if (element && element.offsetTop <= scrollY + 200) {
          setActiveId(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToAnchor = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: "smooth",
      });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-2"
        >
          <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-full p-2 shadow-spatial flex flex-col gap-1 ring-1 ring-black/5">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToAnchor(item.anchor)}
                  className={cn(
                    "group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                    isActive
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                      : "text-slate-400 hover:text-slate-900 hover:bg-slate-100",
                  )}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />

                  {/* Tooltip */}
                  <div className="absolute right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>

                  {/* Active Indicator Dot */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-dot"
                      className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-teal-500 rounded-full border-2 border-white"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
