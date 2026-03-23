import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/lib/cookie-consent";
import { getPublicSiteUrl } from "@/lib/site-url";

const FALLBACK_ORIGIN = "https://bluprntai.com";

type LegalPageShellProps = {
  title: string;
  metaDescription: string;
  /** Path only, e.g. `/privacy` — used for canonical and Open Graph URLs */
  canonicalPath: string;
  lastUpdated?: string;
  children: ReactNode;
};

/**
 * Shared shell for Privacy, Terms, and similar static legal pages — matches landing/dashboard visual language.
 */
export function LegalPageShell({
  title,
  metaDescription,
  canonicalPath,
  lastUpdated = "March 23, 2026",
  children,
}: LegalPageShellProps) {
  const base =
    getPublicSiteUrl() ||
    (typeof window !== "undefined" ? window.location.origin : FALLBACK_ORIGIN);
  const path = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = `${base.replace(/\/$/, "")}${path}`;

  return (
    <div className="min-h-screen mesh-bg text-slate-900">
      <Helmet htmlAttributes={{ lang: "en" }}>
        <title>{title} — BLUPRNT</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={`${title} — BLUPRNT`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:site_name" content="BLUPRNT" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${title} — BLUPRNT`} />
        <meta name="twitter:description" content={metaDescription} />
      </Helmet>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6"
          aria-label="Legal page"
        >
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md ring-1 ring-slate-200/60 sm:h-11 sm:w-11 sm:rounded-2xl sm:p-2">
              <img
                src="/bluprnt_logo.svg"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
            <span className="truncate text-lg font-black italic tracking-tighter text-slate-900 sm:text-xl">
              BLUPRNT<span className="text-indigo-600">.AI</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-slate-600">
                Sign in
              </Button>
            </Link>
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl border-slate-200 bg-white/80 text-slate-800 shadow-sm hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" aria-hidden />
                Home
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <article
          className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-300/25 ring-1 ring-white/60 backdrop-blur-sm"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 120% 80% at 0% -20%, rgba(99, 102, 241, 0.06), transparent 50%)",
          }}
        >
          <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-transparent px-6 py-8 sm:px-10 sm:py-10">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 sm:text-[11px]">
              Legal
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Last updated{" "}
              <time dateTime="2026-03-23">{lastUpdated}</time>
            </p>
          </div>
          <div className="px-6 py-8 sm:px-10 sm:py-10">{children}</div>
        </article>
      </main>

      <footer className="border-t border-slate-200/80 bg-slate-50/80 px-4 py-10 sm:px-6" role="contentinfo">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <span className="font-black italic tracking-tighter text-slate-900">
              BLUPRNT<span className="text-indigo-600">.AI</span>
            </span>
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
            <span className="text-xs font-medium text-slate-500 sm:text-sm">
              Home renovation financial OS
            </span>
          </div>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600"
            aria-label="Footer"
          >
            <Link to="/" className="font-medium hover:text-slate-900">
              Home
            </Link>
            <Link to={{ pathname: "/", hash: "faq" }} className="font-medium hover:text-slate-900">
              Questions
            </Link>
            <Link to="/onboarding" className="font-medium hover:text-slate-900">
              Get started
            </Link>
            <Link to="/privacy" className="font-medium hover:text-slate-900">
              Privacy
            </Link>
            <Link to="/terms" className="font-medium hover:text-slate-900">
              Terms
            </Link>
            <a href="mailto:privacy@bluprntai.com" className="font-medium hover:text-slate-900">
              Contact
            </a>
            <button
              type="button"
              onClick={() => openCookieSettings()}
              className="font-medium hover:text-slate-900"
            >
              Cookie settings
            </button>
          </nav>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-slate-400">
          © {new Date().getFullYear()} BLUPRNT. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

/** Section heading for legal body copy */
export function LegalSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 mt-10 border-l-2 border-indigo-500 pl-4 text-lg font-black tracking-tight text-slate-900 first:mt-0 sm:text-xl">
      {children}
    </h2>
  );
}

/** Paragraph for legal body */
export function LegalParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] leading-relaxed text-slate-600 sm:text-base">
      {children}
    </p>
  );
}

/** Bulleted list for legal body */
export function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="ml-1 mt-4 list-none space-y-2.5 border-l border-slate-200 pl-5 text-[15px] text-slate-600 sm:text-base">
      {children}
    </ul>
  );
}

export function LegalListItem({ children }: { children: ReactNode }) {
  return (
    <li className="relative pl-2 before:absolute before:-left-5 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-indigo-400">
      {children}
    </li>
  );
}
