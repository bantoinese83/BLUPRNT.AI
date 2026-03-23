import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  plan: "Project Plan",
  scope: "Scope",
  invoices: "Invoices",
  settings: "Settings",
  onboarding: "Onboarding",
  estimate: "Estimate",
  login: "Login",
  register: "Register",
};

interface BreadcrumbsProps {
  className?: string;
  projectName?: string;
}

export function Breadcrumbs({ className, projectName }: BreadcrumbsProps) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show on root landing page
  if (pathnames.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1.5 text-sm font-medium text-slate-500", className)}
    >
      <Link
        to="/"
        className="flex items-center hover:text-slate-900 transition-colors duration-200"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        
        // Use project name for specific dashboard subpaths if available
        const label = routeLabels[value] || value.charAt(0).toUpperCase() + value.slice(1);

        
        // Special case: if we're in a dashboard and it's the first segment after dashboard, 
        // and we have a project name, show it
        if (value === "dashboard" && projectName && pathnames.length > 1) {
           // We might want to keep "Dashboard" and then the project name
        }

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            {last ? (
              <span className="text-slate-900 font-bold truncate max-w-[120px] sm:max-w-[200px]">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-slate-800 transition-colors duration-200 truncate max-w-[100px] sm:max-w-none"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
