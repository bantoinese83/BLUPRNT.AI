import { motion } from "motion/react";
import { ArrowRight, UserPlus } from "lucide-react";
import { Highlighter } from "@/components/ui/Highlighter";
import { Button } from "@/components/ui/button";
import { LANDING_HERO_COPY, LANDING_HIGHLIGHT_COLOR } from "./landing-content";

export function HeroSection({
  onStart,
  onCreateAccount,
}: {
  onStart: () => void;
  onCreateAccount: () => void;
}) {
  return (
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
              {LANDING_HERO_COPY.badge}
            </span>
            <h1
              id="hero-heading"
              className="text-4xl font-black tracking-tight text-slate-900 leading-[1.12] sm:text-5xl lg:text-[2.75rem] xl:text-6xl"
            >
              {LANDING_HERO_COPY.titlePrefix}{" "}
              <Highlighter
                action="highlight"
                color={LANDING_HIGHLIGHT_COLOR}
                strokeWidth={4}
                padding={8}
                isView
              >
                <span className="liquid-metal-text">
                  {LANDING_HERO_COPY.titleHighlight}
                </span>
              </Highlighter>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl text-base text-slate-600 leading-relaxed font-medium sm:text-lg"
          >
            {LANDING_HERO_COPY.body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 pt-1"
          >
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
                onClick={onCreateAccount}
              >
                <UserPlus className="mr-2 h-5 w-5" aria-hidden />{" "}
                {LANDING_HERO_COPY.secondaryCta}
              </Button>
            </div>

            <div className="h-12 w-px bg-slate-200/50 hidden sm:block mx-1" />

            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:scale-[1.03] active:scale-[0.97] transition-all"
              aria-label="Download on the App Store"
            >
              <img
                src="/app-store-badge.svg"
                alt="Available on the App Store"
                className="h-10 w-auto sm:h-[42px]"
              />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto flex w-full max-w-[min(100%,280px)] flex-col items-center sm:max-w-[300px] lg:mx-0 lg:ml-auto lg:max-w-[320px] lg:items-end"
        >
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
            <div className="relative rotate-[0.5deg] rounded-[2.4rem] border-[10px] border-slate-900/92 bg-slate-900 p-[3px] shadow-[0_40px_80px_-20px_rgba(15,23,42,0.55),0_0_0_1px_rgba(255,255,255,0.08)_inset] sm:rounded-[2.55rem] sm:border-[11px] sm:p-1">
              <div
                className="pointer-events-none absolute inset-[3px] rounded-[2rem] ring-1 ring-white/12 sm:inset-1 sm:rounded-[2.1rem]"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-[1.85rem] bg-slate-950 shadow-inner sm:rounded-[2rem]">
                <img
                  src="/images/mobile-app-hero.png"
                  alt="BLUPRNT iPhone app: bathroom project with estimate range, documents count, and plan vs documented spend"
                  className="h-auto w-full object-cover object-top"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
            <div
              className="mx-auto -mt-1 h-4 w-[42%] rounded-[100%] bg-slate-900/18 blur-lg"
              aria-hidden
            />
          </div>

          <p className="relative z-[1] mt-4 w-full text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-xs lg:pr-1 lg:text-right">
            Real app preview · iOS
          </p>
        </motion.div>
      </div>
    </section>
  );
}
