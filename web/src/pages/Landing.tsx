import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { PublicPageSEO } from "@/components/seo/PublicPageSEO";
import {
  LANDING_KEYWORDS,
  LANDING_PAGE_DESCRIPTION,
  LANDING_PAGE_TITLE,
} from "@/lib/seo-meta";
import { buildLandingJsonLd, getPublicSiteUrl } from "@/lib/site-url";
import { PUBLIC_SITE_ORIGIN } from "@shared/constants/public-site";
import { HeroSection } from "@/components/landing/HeroSection";
import { useAuth } from "@/hooks/use-auth";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingBelowFold } from "@/components/landing/LandingBelowFold";

const SITE_URL =
  getPublicSiteUrl() ||
  getAuthCallbackUrl().replace(/\/auth\/callback$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

const FALLBACK_SITE_URL = PUBLIC_SITE_ORIGIN;

export default function Landing() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { user } = useAuth();
  const [isArchitect, setIsArchitect] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setIsArchitect(false);
        return;
      }

      const { data } = await supabase
        .from("user_subscriptions")
        .select("status, current_period_end, revenuecat_entitlement_active")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsArchitect(isArchitectPlanEffective(data));
    }
    checkSubscription();
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    const refresh = () => {
      void (async () => {
        const { data } = await supabase
          .from("user_subscriptions")
          .select("status, current_period_end, revenuecat_entitlement_active")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsArchitect(isArchitectPlanEffective(data));
      })();
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [user?.id]);

  const metaBase = SITE_URL || FALLBACK_SITE_URL;
  const jsonLd = buildLandingJsonLd(metaBase);

  const handlePlanSelect = useCallback(
    async (plan: "architect" | "pass") => {
      if (!isSupabaseConfigured()) {
        navigate("/login");
        return;
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          navigate(`/dashboard?upgrade=${plan}`);
          return;
        }
      } catch {
        // Session check failed; fall through to login
      }
      const afterAuth = `/dashboard?upgrade=${plan}`;
      navigate(`/login?redirect=${encodeURIComponent(afterAuth)}`);
    },
    [navigate],
  );

  useEffect(() => {
    if (!hash) return;
    const targetId = hash.replace("#", "");
    const el = document.getElementById(targetId);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [hash]);

  return (
    <>
      <PublicPageSEO
        title={LANDING_PAGE_TITLE}
        description={LANDING_PAGE_DESCRIPTION}
        canonicalPath="/"
        keywords={LANDING_KEYWORDS}
        preloadImages={["/images/hero-iphone-screenshot-480.webp"]}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-slate-50 text-slate-900">
        <LandingHeader />

        <main>
          <HeroSection
            onStart={() => navigate("/onboarding")}
            onCreateAccount={() => navigate("/register")}
            onSeeHowItWorks={() => {
              document.getElementById("how")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            onAddAnotherProject={() => {
              navigate(
                `/login?redirect=${encodeURIComponent("/onboarding?newProject=1")}`,
              );
            }}
          />

          <LandingBelowFold
            isArchitect={isArchitect}
            onPlanSelect={handlePlanSelect}
          />
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
