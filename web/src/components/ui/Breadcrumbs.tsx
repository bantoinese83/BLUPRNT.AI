import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  plan: "Project Plan",
  scope: "Scope",
  execute: "Execute",
  record: "Record",
  settings: "Settings",
  onboarding: "Onboarding",
  estimate: "Estimate",
  login: "Login",
  register: "Register",
  "forgot-password": "Forgot password",
  auth: "Account",
  "reset-password": "Reset password",
};

function labelForSegment(value: string): string {
  if (routeLabels[value]) return routeLabels[value];
  if (value.includes("-")) {
    return value
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type CrumbPath = { kind: "path"; value: string; pathIndex: number };
type CrumbProject = { kind: "project"; name: string };
type CrumbItem = CrumbPath | CrumbProject;

interface BreadcrumbsProps {
  className?: string;
  projectName?: string;
}

export function Breadcrumbs({ className, projectName }: BreadcrumbsProps) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  const isDashboardShell = pathnames[0] === "dashboard";
  const homeHref = isDashboardShell ? "/dashboard" : "/";
  const homeAriaLabel = isDashboardShell ? "Dashboard home" : "Site home";

  const trimmedProject = projectName?.trim() ?? "";
  const items: CrumbItem[] = [];
  pathnames.forEach((value, pathIndex) => {
    items.push({ kind: "path", value, pathIndex });
    if (
      value === "dashboard" &&
      trimmedProject &&
      pathnames.length > 1 &&
      pathIndex === 0
    ) {
      items.push({ kind: "project", name: trimmedProject });
    }
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex min-w-0 items-center text-sm font-medium text-slate-500",
        className,
      )}
    >
      <ol className="m-0 flex min-w-0 list-none flex-wrap items-center gap-x-1.5 p-0">
        <li className="flex min-w-0 items-center">
          <Link
            to={homeHref}
            className="flex shrink-0 items-center transition-colors duration-200 hover:text-slate-900"
            aria-label={homeAriaLabel}
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </li>
        {items.map((item, itemIndex) => {
          if (item.kind === "project") {
            return (
              <li
                key={`project-${itemIndex}-${item.name}`}
                className="flex min-w-0 max-w-full items-center gap-x-1.5"
              >
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-slate-300"
                  aria-hidden
                />
                <span
                  className="max-w-[140px] truncate font-medium text-slate-600 sm:max-w-[240px]"
                  title={item.name}
                >
                  {item.name}
                </span>
              </li>
            );
          }

          const { value, pathIndex } = item;
          const isCurrentPage = pathIndex === pathnames.length - 1;
          const to = `/${pathnames.slice(0, pathIndex + 1).join("/")}`;
          const label = labelForSegment(value);

          return (
            <li
              key={to}
              className="flex min-w-0 max-w-full items-center gap-x-1.5"
            >
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-slate-300"
                aria-hidden
              />
              {isCurrentPage ? (
                <span
                  className="max-w-[120px] truncate font-bold text-slate-900 sm:max-w-[200px]"
                  aria-current="page"
                  title={label}
                >
                  {label}
                </span>
              ) : (
                <Link
                  to={to}
                  className="max-w-[100px] truncate transition-colors duration-200 hover:text-slate-800 sm:max-w-none"
                  title={label}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
