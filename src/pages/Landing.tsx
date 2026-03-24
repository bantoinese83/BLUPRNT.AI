import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Helmet } from "react-helmet-async";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import {
  buildLandingJsonLd,
  getPublicSiteUrl,
  LANDING_FAQ,
} from "@/lib/site-url";
import { HeroSection } from "@/components/landing/HeroSection";
import { PLAN_COMPARISON_ROWS } from "@/components/landing/landing-content";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingStory } from "@/components/landing/LandingStory";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

const SITE_URL =
  getPublicSiteUrl() ||
  getAuthCallbackUrl().replace(/\/auth\/callback$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

const FALLBACK_SITE_URL = "https://bluprntai.com";

export default function Landing() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  const metaBase = SITE_URL || FALLBACK_SITE_URL;
  const jsonLd = buildLandingJsonLd(metaBase);

  const scrollToSection = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handlePlanSelect = useCallback(
    async (plan: "architect" | "pass") => {
      if (!isSupabaseConfigured()) {
        navigate("/login");
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate(`/dashboard?upgrade=${plan}`);
        return;
      }
      const afterAuth = `/dashboard?upgrade=${plan}`;
      navigate(`/login?redirect=${encodeURIComponent(afterAuth)}`);
    },
    [navigate],
  );

  useEffect(() => {
    if (hash !== "#faq") return;
    const el = document.getElementById("faq");
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [hash]);

  return (
    <>
      <Helmet htmlAttributes={{ lang: "en" }}>
        <title>
          Home Renovation Cost Estimator &amp; Remodel Budget Tracker |
          BLUPRNT.AI
        </title>
        <meta
          name="description"
          content="Get professional renovation cost estimates from photos and ZIP, track your remodel budget, and export a property ledger for resale. The financial home for homeowners."
        />
        <meta
          name="keywords"
          content="home renovation cost estimator, remodel budget tracker, kitchen remodel cost, bathroom remodel cost, home improvement record, property ledger, AI renovation planner, renovation cost estimator, home remodel budget, invoice tracking, seller packet"
        />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
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
        <meta
          property="og:image:alt"
          content="BLUPRNT — home renovation financial planning for homeowners"
        />
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
        <meta
          name="twitter:image:alt"
          content="BLUPRNT — home renovation financial planning"
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-50 text-slate-900">
        <LandingHeader scrollToSection={scrollToSection} />

        <main>
          <HeroSection
            onStart={() => navigate("/onboarding")}
            onCreateAccount={() => navigate("/register")}
          />

          <LandingSocialProof />
          <LandingHowItWorks />
          <LandingStory />
          <LandingFeatures />
          <LandingPricing
            onPlanSelect={handlePlanSelect}
            planComparisonRows={PLAN_COMPARISON_ROWS}
          />
          <LandingFaq faqData={LANDING_FAQ} />
          <LandingFinalCta />
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
