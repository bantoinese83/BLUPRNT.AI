import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { openCookieSettings } from "@/lib/cookie-consent";
import { buildLandingJsonLd, getPublicSiteUrl, LANDING_FAQ } from "@/lib/site-url";
import {
  ArrowRight,
  BarChart3,
  Home,
  LogIn,
  Menu,
  Receipt,
  Shield,
  UserPlus,
  Camera,
  FileCheck,
  MessageCircleQuestion,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";
import { UpgradeIcon } from "@/components/ui/UpgradeIcon";
import { Highlighter } from "@/components/ui/Highlighter";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";



const SITE_URL =
  getPublicSiteUrl() ||
  getAuthCallbackUrl().replace(/\/auth\/callback$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

const FALLBACK_SITE_URL = "https://bluprntai.com";

const PLAN_COMPARISON_ROWS = [
  {
    feature: "Active projects",
    architect: "Up to 2 at once",
    pass: "One project",
    hint: "How many remodels you can run in parallel.",
  },
  {
    feature: "Photo-to-estimate",
    architect: "Unlimited",
    pass: "Unlimited",
    hint: "Turn photos and scope into grounded cost ranges.",
  },
  {
    feature: "Smart invoice scanning",
    architect: "10 per month",
    pass: "Unlimited for 6 months",
    hint: "OCR and sorting for quotes and receipts.",
  },
  {
    feature: "Property ledger",
    architect: "Full access",
    pass: "Full access",
    hint: "Your improvement history in one place.",
  },
  {
    feature: "Export records",
    architect: "Unlimited",
    pass: "Unlimited",
    hint: "Packets and exports for buyers, agents, and lenders.",
  },
  {
    feature: "Support",
    architect: "Priority",
    pass: "Standard",
    hint: "How fast we get back when you need help.",
  },
  {
    feature: "Billing",
    architect: "$12 / month",
    pass: "$49 one-time",
    hint: "Choose ongoing or a single-project pass.",
  },
] as const;

export default function Landing() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [dbCount, setDbCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => {
        if (typeof count === "number") setDbCount(count);
      });
  }, []);
  const metaBase = SITE_URL || FALLBACK_SITE_URL;
  const jsonLd = buildLandingJsonLd(metaBase);

  const scrollToSection = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    if (hash !== "#faq") return;
    const el = document.getElementById("faq");
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [hash]);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setMobileNavOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <Helmet htmlAttributes={{ lang: "en" }}>
        <title>BLUPRNT — Renovation Cost Estimates, Invoice Tracking &amp; Seller Records</title>
        <meta
          name="description"
          content="Renovation estimates from photos and location, smart invoice scanning and history, seller record export for homeowners."
        />
        <meta
          name="keywords"
          content="renovation cost estimator, home remodel budget, kitchen remodel cost, bathroom remodel cost, invoice tracking, home improvement records, seller packet, property ledger, homeowner renovation app"
        />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href={metaBase} />
        <link rel="alternate" hrefLang="en-US" href={metaBase} />
        <link rel="alternate" hrefLang="x-default" href={metaBase} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={metaBase} />
        <meta property="og:locale" content="en_US" />
        <meta
          property="og:title"
          content="BLUPRNT — Renovation cost estimates &amp; financial records for homeowners"
        />
        <meta
          property="og:description"
          content="Grounded remodel cost ranges, invoice tracking, and a clear improvement history for buyers and agents. Built for homeowners—not contractors."
        />
        <meta property="og:site_name" content="BLUPRNT" />
        <meta property="og:image" content={`${metaBase}/og-image.png`} />
        <meta property="og:image:alt" content="BLUPRNT — home renovation financial planning for homeowners" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="BLUPRNT — Renovation cost estimates &amp; financial records"
        />
        <meta
          name="twitter:description"
          content="Plan remodels with grounded estimates, track spending, and keep a resale-ready renovation record."
        />
        <meta name="twitter:image" content={`${metaBase}/og-image.png`} />
        <meta name="twitter:image:alt" content="BLUPRNT — home renovation financial planning" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-shadow duration-300 ${
            headerScrolled ? "shadow-sm shadow-slate-200/50" : ""
          }`}
        >
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <nav
              className="flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]"
              aria-label="Main navigation"
            >
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="min-w-0 shrink"
              >
                <Link
                  to="/"
                  className="flex min-w-0 items-center gap-2.5 rounded-xl outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 sm:gap-3"
                  aria-label="BLUPRNT — Home"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1 shadow-md ring-1 ring-slate-200/40 sm:h-11 sm:w-11 sm:rounded-2xl sm:p-1.5">
                    <img
                      src="/bluprnt_logo.svg"
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="truncate pr-1 text-lg font-black italic tracking-tighter text-slate-900 sm:text-xl">
                    BLUPRNT<span className="text-indigo-600">.AI</span>
                  </span>
                </Link>
              </motion.div>

              {/* Desktop in-page links */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-1/2 hidden -translate-x-1/2 lg:flex lg:items-center lg:gap-0.5"
              >
                {(
                  [
                    ["how", "How it works"],
                    ["features", "Features"],
                    ["pricing", "Pricing"],
                    ["faq", "Questions"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900"
                  >
                    {label}
                  </button>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex shrink-0 items-center gap-1.5 sm:gap-2"
              >
                <Link to="/login" className="hidden lg:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <LogIn className="mr-1.5 h-4 w-4" aria-hidden />
                    Sign in
                  </Button>
                </Link>

                <Link to="/onboarding" className="flex lg:hidden">
                  <Button
                    size="sm"
                    variant="primary"
                    className="rounded-xl px-3.5 text-xs font-bold shadow-md shadow-indigo-500/15"
                  >
                    Start
                  </Button>
                </Link>

                <Link to="/onboarding" className="hidden lg:block">
                  <Button
                    size="sm"
                    variant="primary"
                    className="rounded-xl shadow-md shadow-indigo-500/20"
                  >
                    Get started
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Button>
                </Link>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
                  aria-expanded={mobileNavOpen}
                  aria-controls="landing-mobile-nav"
                  aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                  onClick={() => setMobileNavOpen((o) => !o)}
                >
                  {mobileNavOpen ? (
                    <X className="h-5 w-5" aria-hidden />
                  ) : (
                    <Menu className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </motion.div>
            </nav>

            {/* Mobile panel */}
            {mobileNavOpen ? (
              <div
                id="landing-mobile-nav"
                className="border-t border-slate-200/80 bg-white/95 py-4 backdrop-blur-xl lg:hidden"
              >
                <div className="flex flex-col gap-1">
                  {(
                    [
                      ["how", "How it works"],
                      ["features", "Features"],
                      ["pricing", "Pricing"],
                      ["faq", "Questions"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => scrollToSection(id)}
                      className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="my-2 border-t border-slate-100" />
                  <Link
                    to="/login"
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <LogIn className="h-4 w-4 text-slate-500" aria-hidden />
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <UserPlus className="h-4 w-4 text-slate-500" aria-hidden />
                    Create account
                  </Link>
                  <Link to="/onboarding" onClick={() => setMobileNavOpen(false)} className="mt-2 px-1">
                    <Button variant="primary" className="h-11 w-full rounded-xl font-bold shadow-md shadow-indigo-500/20">
                      Get started
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <main>
          {/* Hero */}
          <section
            className="relative overflow-hidden px-4 pt-24 pb-14 sm:px-6 sm:pt-28 sm:pb-16 mesh-bg"
            aria-labelledby="hero-heading"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-slate-100/50 via-transparent to-transparent opacity-60" />

            <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-10">
              <div className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-[0.18em] inline-block">
                    Home Renovation Financial OS
                  </span>
                  <h1
                    id="hero-heading"
                    className="text-4xl font-black tracking-tight text-slate-900 leading-[1.12] sm:text-5xl lg:text-[2.75rem] xl:text-6xl"
                  >
                    Turn your renovation into a{" "}
                    <Highlighter action="highlight" color="rgba(99, 102, 241, 0.2)" strokeWidth={4} padding={8} isView={true}>
                      <span className="liquid-metal-text">financial plan</span>
                    </Highlighter>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="max-w-xl text-base text-slate-600 leading-relaxed font-medium sm:text-lg"
                >
                  Turn renovations into a{" "}
                  <Highlighter action="underline" color="#6366f1" strokeWidth={2} padding={0} isView={true}>
                    trackable financial asset
                  </Highlighter>{" "}
                  for your home. Get real-world costs, track invoices, and build a record you can hand to buyers.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-3 pt-1"
                >
                  <Button
                    size="lg"
                    className="h-12 px-6 text-base font-black rounded-xl liquid-metal-button hover:scale-[1.02] active:scale-[0.98] transition-all text-white border-0 sm:px-7"
                    onClick={() => navigate("/onboarding")}
                  >
                    Get my first estimate <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-6 text-base font-black rounded-xl glass border-slate-200 hover:bg-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all sm:px-7"
                    onClick={() => navigate("/register")}
                  >
                    <UserPlus className="mr-2 h-5 w-5" aria-hidden /> Create free account
                  </Button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="relative mx-auto w-full max-w-lg lg:max-w-none"
              >
                <div className="absolute -inset-3 rounded-[1.75rem] bg-linear-to-r from-slate-500/15 to-slate-400/15 blur-2xl lg:-inset-2" />
                <div className="relative glass-card overflow-hidden rounded-[1.75rem] p-1.5 shadow-xl sm:rounded-[2rem] sm:p-2">
                  <img
                    src="/images/renovation_hero.png"
                    alt="Modern Home Renovation"
                    className="max-h-[min(38vh,340px)] w-full rounded-[1.25rem] object-cover object-center shadow-inner sm:max-h-[min(42vh,380px)] sm:rounded-[1.75rem] lg:max-h-[min(48vh,420px)]"
                  />

                  <div className="absolute bottom-3 left-3 right-3 glass-card animate-float rounded-xl p-3 sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-md sm:h-11 sm:w-11 sm:rounded-xl">
                        <UpgradeIcon className="h-5 w-5 brightness-0 invert" aria-hidden />
                      </div>


                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 leading-tight sm:text-sm">
                          AI Cost Analysis
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 sm:text-xs">
                          Regionally grounded pricing
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Social Proof / Stats */}
          <section className="bg-white border-y border-slate-100 py-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
                <div className="flex flex-col items-center gap-2 lg:items-start">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Trusted by homeowners
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {dbCount !== null ? dbCount.toLocaleString() : "..."} <span className="text-slate-500 font-bold">blueprints managed</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                  <div className="flex items-center justify-center font-black italic tracking-tighter text-slate-900 text-xl">
                    RE/MAX
                  </div>
                  <div className="flex items-center justify-center font-black italic tracking-tighter text-slate-900 text-xl">
                    Zillow
                  </div>
                  <div className="flex items-center justify-center font-black italic tracking-tighter text-slate-900 text-xl">
                    Better
                  </div>
                  <div className="flex items-center justify-center font-black italic tracking-tighter text-slate-900 text-xl">
                    Houzz
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section
            id="how"
            className="border-t border-slate-200/80 bg-white px-4 py-20 sm:px-6 scroll-mt-24 sm:scroll-mt-28"
            aria-labelledby="how-heading"
          >
            <div className="mx-auto max-w-6xl">
              <h2 id="how-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
                How it works
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
                From idea to resale — in three steps.
              </p>
              <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                <motion.article
                  initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-slate-100"
                >
                  <div className="w-full h-56 mb-8 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200">
                    <img src="/images/modern_transformation_hero.png" alt="Modern Home Exterior" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent" />
                  </div>

                  <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-900 flex items-center justify-center mb-8 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
                    <Camera className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-slate-950 transition-colors">Plan</h3>

                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    Turn fuzzy ideas and photos into a realistic, regionally grounded budget.
                  </p>
                </motion.article>

                <motion.article
                  initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-slate-100"
                >
                  <div className="w-full h-56 mb-8 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200">
                    <img src="/images/invoice_system_mockup.png" alt="Invoice Tracking System" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <div className="flex gap-2 mb-2">
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">Verified OCR</span>
                        <span className="bg-slate-500/20 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">Smart Sorting</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-900 flex items-center justify-center mb-8 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
                    <Receipt className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-slate-950 transition-colors">
                    <Highlighter action="circle" color="#6366f1" strokeWidth={2} padding={10} isView={true}>
                      Execute
                    </Highlighter>
                  </h3>

                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    Track quotes, actuals, and invoices against that budget with minimal manual work.
                  </p>
                </motion.article>

                <motion.article
                  initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-slate-100"
                >
                  <div className="w-full h-56 mb-8 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200">
                    <img src="/images/seller_packet_mockup.png" alt="Buyer Handover Packet" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent" />
                  </div>

                  <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-900 flex items-center justify-center mb-8 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
                    <FileCheck className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-slate-950 transition-colors">Transfer</h3>

                  <p className="text-slate-500 text-lg leading-relaxed font-medium mb-6">
                    Export that history into formats optimized for every stakeholder.
                  </p>
                  
                  <div className="flex flex-col gap-3 w-full max-w-[280px]">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                      <span className="text-xs font-bold text-slate-900">For Buyers</span>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-200/50 px-2 py-1 rounded-md">PDF Packet</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                      <span className="text-xs font-bold text-slate-900">For Agents</span>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-200/50 px-2 py-1 rounded-md">MLS-Ready</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                      <span className="text-xs font-bold text-slate-900">For Lenders</span>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-200/50 px-2 py-1 rounded-md">Verified Ledger</span>
                    </div>
                  </div>

                </motion.article>
              </div>
            </div>
          </section>

          {/* Our Story / Trust Section */}
          <section className="bg-slate-50 py-24 px-4 sm:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-block p-3 rounded-2xl bg-white shadow-sm border border-slate-100 mb-6">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Built by homeowners, for homeowners.</h2>
              <div className="space-y-4 text-lg text-slate-600 leading-relaxed font-medium">
                <p>
                  We started BLUPRNT because we were tired of "cost estimates" that were actually lead-gen traps for contractors. Renovations are stressful enough—the financial planning shouldn't be.
                </p>
                <p>
                  Our mission is to turn every renovation into a trackable, transparent financial asset. We believe homeowners deserve a clear, regional-grounded path from their first photo to their final sale.
                </p>
              </div>
              <div className="mt-12">
                <p className="mb-8 text-center text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:mb-10">
                  The BLUPRNT Team
                </p>
                <div className="flex flex-col items-stretch justify-center gap-10 sm:flex-row sm:items-start sm:gap-14 lg:gap-16">
                  <figure className="mx-auto flex max-w-[14rem] flex-col items-center text-center sm:mx-0">
                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-white shadow-xl shadow-slate-300/40 ring-[3px] ring-white sm:h-36 sm:w-36">
                      <img
                        src="/headshot-bryan.PNG"
                        alt="Portrait of Bryan Antoine, co-founder of BLUPRNT"
                        className="h-full w-full object-cover object-[center_15%]"
                        width={288}
                        height={288}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <figcaption className="mt-4 space-y-0.5">
                      <span className="block text-base font-black tracking-tight text-slate-900">
                        Bryan Antoine
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Co-founder
                      </span>
                    </figcaption>
                  </figure>
                  <figure className="mx-auto flex max-w-[14rem] flex-col items-center text-center sm:mx-0">
                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-white shadow-xl shadow-slate-300/40 ring-[3px] ring-white sm:h-36 sm:w-36">
                      <img
                        src="/headshot-lauren.PNG"
                        alt="Portrait of Lauren Antoine, co-founder of BLUPRNT"
                        className="h-full w-full object-cover object-[center_15%]"
                        width={288}
                        height={288}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <figcaption className="mt-4 space-y-0.5">
                      <span className="block text-base font-black tracking-tight text-slate-900">
                        Lauren Antoine
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Co-founder
                      </span>
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section
            id="features"
            className="border-t border-slate-200/80 bg-slate-50/50 px-4 py-20 sm:px-6 scroll-mt-24 sm:scroll-mt-28"
            aria-labelledby="features-heading"
          >
            <div className="mx-auto max-w-6xl">
              <h2 id="features-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
                Built for homeowners
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
                Not contractors. You — planning, selling, or improving.
              </p>
              <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4" role="list">
                <li className="flex items-start gap-4">
                  <BarChart3 className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-slate-900">Photo-to-estimate</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Snap photos, get a grounded cost range in seconds.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Receipt className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-slate-900">Invoice tracking</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Upload receipts and quotes — we keep them organized.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Shield className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      <Highlighter action="highlight" color="#ffd1dc" padding={2} isView={true}>
                        Seller packet
                      </Highlighter>
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Document your improvements for buyers and agents.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Home className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-slate-900">Property record</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Your home’s financial twin — from idea to sale.
                    </p>
                  </div>
                </li>
              </ul>

            </div>
          </section>

          {/* Pricing Section */}
          <section
            id="pricing"
            className="border-t border-slate-200/80 bg-white px-4 py-24 sm:px-6 scroll-mt-24 sm:scroll-mt-28"
            aria-labelledby="pricing-heading"
          >
            <div className="mx-auto max-w-6xl">
              <div className="text-center space-y-4 mb-16">
                <h2 id="pricing-heading" className="text-3xl font-black text-slate-900 sm:text-4xl italic uppercase tracking-tighter">
                  Simple, <span className="text-slate-900">transparent</span> pricing
                </h2>

                <p className="mx-auto max-w-xl text-slate-600 text-lg">
                  Protect your renovation investment with the right plan for your project.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
                {/* Architect Plan */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative group p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col"
                >

                  <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-900 rounded-t-3xl" />
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Architect</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tight text-slate-900">$12</span>
                      <span className="text-slate-500 font-bold">/mo</span>
                    </div>
                    <p className="mt-4 text-slate-600 font-medium">Professional grade project tracking for active renovators.</p>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1">
                    {[
                      "Expert AI Insights & Project Strategy",
                      "Up to 10 smart invoice scans per month",
                      "Track up to 2 active projects",
                      "Full property ledger & seller packet",
                      "Cloud-backed Seller Records (PDF)"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                        <UpgradeIcon className="w-5 h-5 opacity-40 shrink-0 grayscale" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-full h-14 rounded-2xl text-lg font-black liquid-metal-button border-0 shadow-lg shadow-slate-100 group-hover:scale-[1.02] transition-transform"

                    onClick={() => navigate("/onboarding")}
                  >
                    Start Architect free
                  </Button>

                </motion.div>

                {/* Project Pass */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="relative group p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Project Pass</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tight text-slate-900">$49</span>
                      <span className="text-slate-500 font-bold">/project</span>
                    </div>
                    <p className="mt-4 text-slate-600 font-medium">One-time purchase for a single major remodel.</p>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1">
                    {[
                      "6 months of Architect features",
                      "Unlimited invoices (this project)",
                      "Expert AI Insights included",
                      "Lifetime read-access to ledger",
                      "Perfect for one major remodel"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full h-14 rounded-2xl text-lg font-black bg-white border-slate-200 hover:bg-white hover:shadow-lg group-hover:scale-[1.02] transition-transform"
                    onClick={() => navigate("/onboarding")}
                  >
                    Get a project pass
                  </Button>
                </motion.div>
              </div>

              <p className="mt-12 text-center text-slate-500 font-medium italic">
                All plans include a 3-invoice free trial per project. No credit card required to start.
              </p>

              {/* Plan comparison */}
              <motion.div
                className="mx-auto mt-20 max-w-4xl sm:mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-8 text-center sm:mb-10">
                  <p className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 sm:text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Plans
                  </p>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Compare at a glance
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
                    Same core product — pick monthly for ongoing work, or a pass for one big remodel.
                  </p>
                </div>

                <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 ring-1 ring-slate-100/80">
                  <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                    <table className="w-full min-w-[520px] border-collapse text-left">
                      <caption className="sr-only">
                        Comparison of Architect subscription and Project Pass for BLUPRNT features
                      </caption>
                      <thead>
                        <tr className="border-b border-slate-200/90">
                          <th
                            scope="col"
                            className="sticky left-0 z-20 min-w-[10.5rem] bg-gradient-to-b from-slate-50 to-slate-50/90 px-4 py-5 text-left align-bottom shadow-[6px_0_14px_-8px_rgba(15,23,42,0.12)] sm:min-w-[13rem] sm:px-6 sm:py-6"
                          >
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              What you get
                            </span>
                          </th>
                          <th
                            scope="col"
                            className="bg-gradient-to-b from-indigo-50 to-indigo-50/80 px-4 py-5 text-center align-bottom sm:px-6 sm:py-6"
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-xs font-black uppercase tracking-[0.14em] text-indigo-900">
                                Architect
                              </span>
                              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm shadow-indigo-900/20">
                                Most flexible
                              </span>
                              <span className="text-sm font-bold tabular-nums text-slate-700">
                                $12<span className="text-slate-500">/mo</span>
                              </span>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="bg-gradient-to-b from-slate-50 to-white px-4 py-5 text-center align-bottom sm:px-6 sm:py-6"
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-800">
                                Project Pass
                              </span>
                              <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
                                One project
                              </span>
                              <span className="text-sm font-bold tabular-nums text-slate-700">
                                $49<span className="text-slate-500"> once</span>
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {PLAN_COMPARISON_ROWS.map((row) => (
                          <tr
                            key={row.feature}
                            className="group border-b border-slate-100/90 transition-colors last:border-0 hover:bg-slate-50/70"
                          >
                            <th
                              scope="row"
                              className="sticky left-0 z-10 min-w-[10.5rem] border-r border-slate-100/90 bg-white px-4 py-4 text-left align-top shadow-[4px_0_12px_-6px_rgba(15,23,42,0.08)] transition-colors group-hover:bg-slate-50/95 sm:min-w-[13rem] sm:px-6 sm:py-5"
                            >
                              <span className="block text-sm font-bold text-slate-900">{row.feature}</span>
                              <span className="mt-1 block text-xs font-medium leading-snug text-slate-500">
                                {row.hint}
                              </span>
                            </th>
                            <td className="bg-indigo-50/35 px-4 py-4 text-center align-top transition-colors group-hover:bg-indigo-50/55 sm:px-6 sm:py-5">
                              <span className="inline-block text-sm font-semibold tabular-nums text-indigo-950">
                                {row.architect}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center align-top text-slate-700 transition-colors group-hover:bg-white/80 sm:px-6 sm:py-5">
                              <span className="inline-block text-sm font-semibold text-slate-800">
                                {row.pass}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 text-center text-xs leading-relaxed text-slate-500 sm:px-6">
                    Project Pass includes Architect features for six months, locked to one project. After that,
                    your ledger stays readable — upgrade anytime if you start another remodel.
                  </p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* FAQ — visible Q&A for users + FAQPage structured data */}
          <section
            id="faq"
            className="scroll-mt-24 border-t border-slate-200/80 bg-slate-50/80 px-4 py-16 sm:scroll-mt-28 sm:px-6 sm:py-20"
            aria-labelledby="faq-heading"
            itemScope
            itemType="https://schema.org/FAQPage"
          >
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 sm:text-[11px]">
                  Questions
                </p>
                <h2
                  id="faq-heading"
                  className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"
                >
                  Common questions
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
                  Straight answers about estimates, tracking, and who BLUPRNT is for.
                </p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {LANDING_FAQ.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm shadow-slate-200/40 sm:p-6"
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                  >
                    <div className="flex gap-3">
                      <MessageCircleQuestion
                        className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500"
                        aria-hidden
                      />
                      <div className="min-w-0 space-y-2">
                        <h3
                          className="text-base font-bold text-slate-900 sm:text-lg"
                          itemProp="name"
                        >
                          {item.question}
                        </h3>
                        <div
                          itemScope
                          itemProp="acceptedAnswer"
                          itemType="https://schema.org/Answer"
                        >
                          <p
                            className="text-sm leading-relaxed text-slate-600 sm:text-[15px]"
                            itemProp="text"
                          >
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section
            className="border-t border-slate-200/80 bg-white px-4 py-24 sm:px-6"
            aria-labelledby="cta-heading"
          >
            <div className="mx-auto max-w-3xl text-center">
              <h2 id="cta-heading" className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Ready to start?
              </h2>
              <p className="mt-4 text-slate-600">
                Get your first estimate in under a minute. No credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/onboarding">
                  <Button size="lg" variant="primary" className="h-12 px-8 text-base">
                    Get my first estimate
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
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
                  Home renovation financial OS — estimates, spending, and records in one place.
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
                      <Link to="/onboarding" className="font-medium hover:text-slate-900">
                        Get started
                      </Link>
                    </li>
                    <li>
                      <Link to="/login" className="font-medium hover:text-slate-900">
                        Sign in
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className="font-medium hover:text-slate-900">
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
                      <Link to="/privacy" className="font-medium hover:text-slate-900">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link to="/terms" className="font-medium hover:text-slate-900">
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
      </div>
    </>
  );
}
