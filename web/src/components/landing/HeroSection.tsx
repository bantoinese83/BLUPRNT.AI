import { ArrowRight, PlayCircle } from "lucide-react";
import { Highlighter } from "@/components/ui/Highlighter";
import { Button } from "@/components/ui/button";
import { Iphone } from "@/components/ui/iphone";
import {
  LANDING_HERO_COPY,
  LANDING_HIGHLIGHT_COLOR,
  LANDING_HIGHLIGHT_UNDERLINE,
} from "./landing-content";
import { IOS_APP_STORE_URL } from "@shared/constants/app-links";

export function HeroSection({
  onStart,
  onCreateAccount,
  onSeeHowItWorks,
}: {
  onStart: () => void;
  onCreateAccount: () => void;
  onSeeHowItWorks: () => void;
}) {
  return (
    <section
      className="relative overflow-hidden px-4 pt-24 pb-14 sm:px-6 sm:pt-28 sm:pb-16 mesh-bg"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/50 via-transparent to-transparent opacity-60" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-5">
          <div className="space-y-3">
            <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-[0.18em] inline-block">
              {LANDING_HERO_COPY.badge}
            </span>
            <h1
              id="hero-heading"
              className="text-4xl font-black tracking-tight text-slate-900 leading-[1.12] sm:text-5xl lg:text-[2.75rem] xl:text-6xl"
            >
              {LANDING_HERO_COPY.titlePrefix}
            </h1>
          </div>

          <p className="max-w-2xl text-base text-slate-800 leading-[1.55] font-medium sm:text-lg">
            <span className="inline leading-[1.55]">
              <Highlighter
                action="underline"
                color={LANDING_HIGHLIGHT_UNDERLINE}
                strokeWidth={2.25}
                padding={2}
                multiline
                isView
                delay={0.02}
              >
                <span className="whitespace-normal text-slate-800">
                  {LANDING_HERO_COPY.bodyLead}
                </span>
              </Highlighter>{" "}
              <Highlighter
                action="highlight"
                color={LANDING_HIGHLIGHT_COLOR}
                strokeWidth={2}
                padding={4}
                multiline
                isView
                delay={0.08}
              >
                <span className="liquid-metal-text font-semibold">
                  {LANDING_HERO_COPY.bodyEmphasis}
                </span>
              </Highlighter>{" "}
              <span className="text-slate-800">
                {LANDING_HERO_COPY.bodyTail}
              </span>
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="h-12 px-6 text-base font-black rounded-xl liquid-metal-button hover:scale-[1.02] active:scale-[0.98] transition-all text-white border-0 sm:px-7"
                  onClick={onStart}
                >
                  {LANDING_HERO_COPY.primaryCta}{" "}
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base font-black rounded-xl glass border-slate-200 hover:bg-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all sm:px-7"
                  onClick={onSeeHowItWorks}
                >
                  <PlayCircle className="mr-2 h-5 w-5" aria-hidden />
                  {LANDING_HERO_COPY.secondaryCta}
                </Button>
              </div>
              <button
                type="button"
                onClick={onCreateAccount}
                className="text-left text-sm font-bold text-teal-700 underline-offset-4 hover:underline sm:self-center sm:pl-1"
              >
                {LANDING_HERO_COPY.createAccountLink}
              </button>
            </div>

            <div className="h-12 w-px bg-slate-200/50 hidden sm:block mx-1" />

            <a
              href={IOS_APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:scale-[1.03] active:scale-[0.97] transition-all"
              aria-label="Download BLUPRNT on the App Store"
            >
              <span className="sr-only">Download BLUPRNT on the App Store</span>
              <img
                src="/app-store-badge.svg"
                alt=""
                width={120}
                height={40}
                decoding="async"
                className="h-10 w-auto sm:h-[42px]"
              />
            </a>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[min(100%,280px)] flex-col items-center sm:max-w-[300px] lg:mx-0 lg:ml-auto lg:max-w-[320px] lg:items-end">
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-[min(420px,52vh)] w-[140%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-[40%] bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,0.35),transparent_68%)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-6 top-8 hidden h-28 w-28 rounded-full bg-teal-400/15 blur-2xl sm:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-8 bottom-24 h-24 w-24 rounded-full bg-slate-400/20 blur-2xl"
            aria-hidden
          />

          <div className="animate-float relative z-[1] w-full">
            <Iphone
              src="/images/mobile-app-hero.webp"
              screenSrcSetWebp="/images/mobile-app-hero-480.webp"
              screenImagePriority="high"
              className="rotate-[0.5deg]"
            />
            <div
              className="mx-auto -mt-1 h-4 w-[42%] rounded-[100%] bg-slate-900/18 blur-lg"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}
