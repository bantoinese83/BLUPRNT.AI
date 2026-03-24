import { Link } from "react-router-dom";
import { openCookieSettings } from "@/lib/cookie-consent";

export function LandingFooter() {
  return (
    <footer
      className="border-t border-slate-200/80 bg-slate-100/50 px-4 py-12 sm:px-6"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
                <img
                  src="/bluprnt_logo.svg"
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-black italic tracking-tighter text-slate-900">
                BLUPRNT<span className="text-indigo-600">.AI</span>
              </span>
            </Link>
            <p className="max-w-xs text-center text-sm text-slate-600 sm:text-left">
              Home renovation financial OS — estimates, spending, and records in
              one place.
            </p>
          </div>

          <nav
            className="flex flex-col gap-8 sm:flex-row sm:gap-12 lg:gap-16"
            aria-label="Footer"
          >
            <div className="text-center sm:text-left">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Product
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-600">
                <li>
                  <Link
                    to="/onboarding"
                    className="font-medium hover:text-slate-900"
                  >
                    Get started
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="font-medium hover:text-slate-900"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="font-medium hover:text-slate-900"
                  >
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Help
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-600">
                <li>
                  <Link
                    to={{ pathname: "/", hash: "faq" }}
                    className="font-medium hover:text-slate-900"
                  >
                    Questions
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:connect@monarch-labs.com"
                    className="font-medium hover:text-slate-900"
                  >
                    Contact us
                  </a>
                </li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Legal
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-600">
                <li>
                  <Link
                    to="/privacy"
                    className="font-medium hover:text-slate-900"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="font-medium hover:text-slate-900"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openCookieSettings()}
                    className="font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cookie settings
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mx-auto mt-10 border-t border-slate-200/80 pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            © {new Date().getFullYear()} BLUPRNT. All rights reserved.
          </p>
          <p className="text-center text-xs text-slate-500 sm:text-right">
            Built by{" "}
            <a
              href="https://www.monarch-labs.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              Monarch Labs
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
