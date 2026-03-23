import React from "react";
import { Link } from "react-router-dom";
import { LogOut, Settings2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { UpgradeIcon } from "@/components/ui/UpgradeIcon";


type DashboardHeaderProps = {
  onSignOut: () => void;
  projectName?: string;
  isArchitect?: boolean;
  onUpgradeClick?: () => void;
  onExportPDF?: () => void;
};


export function DashboardHeader({ onSignOut, projectName, isArchitect, onUpgradeClick, onExportPDF }: DashboardHeaderProps) {
  return (
    <header className="glass sticky top-0 z-50 border-white/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link to="/dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-xl shadow-slate-100/50 ring-2 ring-white border border-slate-100 overflow-hidden sm:h-12 sm:w-12 sm:p-1.5 transition-transform hover:scale-105">
            <img src="/bluprnt_logo.svg" alt="BLUPRNT logo" className="h-full w-full object-contain" />
          </Link>
          <div className="min-w-0">
            <Link to="/dashboard">
              <h1 className="font-black text-slate-950 tracking-tighter block truncate text-lg leading-none mb-1 uppercase italic">
                BLUPRNT<span className="text-slate-900">.AI</span>
              </h1>
            </Link>

            <Breadcrumbs projectName={projectName} className="-mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {projectName && onExportPDF && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-600 hover:bg-white hover:shadow-sm rounded-xl transition-all h-8 sm:h-9 px-2 sm:px-3"
              onClick={onExportPDF}
              type="button"
            >
              <FileDown className="w-4 h-4 sm:mr-2 text-slate-400" />
              <span className="hidden sm:inline font-semibold tracking-tight">Export Report</span>
            </Button>
          )}

          {!isArchitect && onUpgradeClick && (

            <Button 
              variant="primary" 
              size="sm" 
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-100/50 rounded-xl transition-all font-bold px-3 py-1.5 h-8 sm:h-9 premium-gradient"
              onClick={onUpgradeClick}
              type="button"
            >
              <UpgradeIcon className="w-4 h-4 mr-1.5 hidden sm:inline" />

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
            className="text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm rounded-xl transition-all font-semibold"
            onClick={onSignOut}
            type="button"
          >
            <LogOut className="w-4 h-4 sm:mr-2 opacity-70" />
            <span className="hidden sm:inline tracking-tight">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
