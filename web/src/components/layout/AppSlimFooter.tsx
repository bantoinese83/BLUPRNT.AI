import { Link } from "react-router-dom";
import { openCookieSettings } from "@/lib/cookie-consent";
import {
  WEB_APP_PATH_PRIVACY,
  WEB_APP_PATH_SUPPORT,
  WEB_APP_PATH_TERMS,
} from "@shared/constants/public-site";
import { cn } from "@/lib/utils";

type AppSlimFooterProps = {
  className?: string;
  /** Omit on pages where “Home” is redundant (e.g. landing). Default true. */
  showHome?: boolean;
};

/**
 * Compact legal / help strip for auth, app shell, and shared views — matches landing link set without marketing bulk.
 */
export function AppSlimFooter({
  className,
  showHome = true,
}: AppSlimFooterProps) {
  return (
    <footer
      role="contentinfo"
      className={cn(
        "border-t border-slate-200/80 bg-white/70 px-4 py-5 backdrop-blur-md sm:px-6",
        className,
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-y-2"
        aria-label="Site footer"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 sm:text-sm">
          {showHome ? (
            <Link to="/" className="transition-colors hover:text-slate-900">
              Home
            </Link>
          ) : null}
          <Link
            to={WEB_APP_PATH_PRIVACY}
            className="transition-colors hover:text-slate-900"
          >
            Privacy
          </Link>
          <Link
            to={WEB_APP_PATH_TERMS}
            className="transition-colors hover:text-slate-900"
          >
            Terms
          </Link>
          <Link
            to={{ pathname: "/", hash: "faq" }}
            className="transition-colors hover:text-slate-900"
          >
            Questions
          </Link>
          <Link
            to={WEB_APP_PATH_SUPPORT}
            className="transition-colors hover:text-slate-900"
          >
            Support
          </Link>
          <a
            href="mailto:connect@monarch-labs.com"
            className="transition-colors hover:text-slate-900"
          >
            Contact
          </a>
          <button
            type="button"
            onClick={() => openCookieSettings()}
            className="transition-colors hover:text-slate-900"
          >
            Cookie settings
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-white p-0.5 shadow-xs">
              <img
                src="/bluprnt_logo.webp"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
            <p className="text-[12px] font-bold text-slate-900">
              © {new Date().getFullYear()} BLUPRNT
            </p>
          </div>
          <p className="text-[10px] text-slate-500">
            Built by{" "}
            <a
              href="https://www.monarch-labs.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-900 hover:text-teal-600 transition-colors"
            >
              Monarch Labs
            </a>
          </p>
        </div>
      </nav>
    </footer>
  );
}
