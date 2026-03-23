import { Link } from "react-router-dom";
import { LogOut, Settings2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  onSignOut: () => void;
  projectName?: string;
  isArchitect?: boolean;
  onUpgradeClick?: () => void;
};

export function DashboardHeader({ onSignOut, projectName, isArchitect, onUpgradeClick }: DashboardHeaderProps) {

  return (
    <header className="glass sticky top-0 z-50 border-white/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-slate-100/50 ring-4 ring-white border border-slate-100 overflow-hidden">

            <img src="/logo.png" alt="BLUPRNT.AI Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-slate-950 tracking-tighter block truncate text-xl leading-none mb-0.5 uppercase italic">
              BLUPRNT<span className="text-slate-900">.AI</span>
            </h1>

            <div className="flex items-center gap-2 leading-none">
              {projectName && (
                <span className="text-[11px] text-slate-500 truncate block font-semibold uppercase tracking-wider opacity-80">
                  {projectName}
                </span>
              )}
              {isArchitect && (
                <span className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm shadow-slate-200">
                  Architect
                </span>
              )}

            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isArchitect && onUpgradeClick && (
            <Button 
              variant="primary" 
              size="sm" 
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-100/50 rounded-xl transition-all font-bold px-3 py-1.5 h-8 sm:h-9 premium-gradient"
              onClick={onUpgradeClick}
              type="button"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span className="tracking-tight text-xs sm:text-sm">Upgrade</span>
            </Button>
          )}

          {isArchitect && onUpgradeClick && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-900 hover:bg-slate-50 rounded-xl transition-all font-bold px-3 py-1.5 h-8 sm:h-9"
              onClick={onUpgradeClick}
              type="button"
            >
              <span className="tracking-tight text-xs sm:text-sm">Manage Plan</span>
            </Button>
          )}

          <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

          <Link to="/settings" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-white hover:shadow-sm rounded-xl transition-all" type="button">
              <Settings2 className="w-4 h-4 mr-2 text-slate-400" />
              <span className="font-semibold tracking-tight">Settings</span>
            </Button>
          </Link>
          <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm rounded-xl transition-all"
            onClick={onSignOut}
            type="button"
          >
            <LogOut className="w-4 h-4 sm:mr-2 opacity-70" />
            <span className="hidden sm:inline font-semibold tracking-tight">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
