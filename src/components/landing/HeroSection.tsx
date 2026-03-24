import { motion } from "motion/react";
import { ArrowRight, UserPlus } from "lucide-react";
import { Highlighter } from "@/components/ui/Highlighter";
import { Button } from "@/components/ui/button";
import { UpgradeIcon } from "@/components/ui/UpgradeIcon";
import { LANDING_HERO_COPY, LANDING_HIGHLIGHT_COLOR } from "./landing-content";

export function HeroSection({ onStart, onCreateAccount }: { onStart: () => void; onCreateAccount: () => void }) {
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
              <Highlighter action="highlight" color={LANDING_HIGHLIGHT_COLOR} strokeWidth={4} padding={8} isView>
                <span className="liquid-metal-text">{LANDING_HERO_COPY.titleHighlight}</span>
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
            className="flex flex-wrap gap-3 pt-1"
          >
            <Button
              size="lg"
              className="h-12 px-6 text-base font-black rounded-xl liquid-metal-button hover:scale-[1.02] active:scale-[0.98] transition-all text-white border-0 sm:px-7"
              onClick={onStart}
            >
              {LANDING_HERO_COPY.primaryCta} <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 text-base font-black rounded-xl glass border-slate-200 hover:bg-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all sm:px-7"
              onClick={onCreateAccount}
            >
              <UserPlus className="mr-2 h-5 w-5" aria-hidden /> {LANDING_HERO_COPY.secondaryCta}
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
              alt="Modern home renovation cost estimator dashboard showing AI-driven budget analysis"
              className="max-h-[min(38vh,340px)] w-full rounded-[1.25rem] object-cover object-center shadow-inner sm:max-h-[min(42vh,380px)] sm:rounded-[1.75rem] lg:max-h-[min(48vh,420px)]"
            />

            <div className="absolute bottom-3 left-3 right-3 glass-card animate-float rounded-xl p-3 sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-2xl sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-md sm:h-11 sm:w-11 sm:rounded-xl">
                  <UpgradeIcon className="h-5 w-5 brightness-0 invert" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 leading-tight sm:text-sm">AI Cost Analysis</p>
                  <p className="text-[11px] font-bold text-slate-500 sm:text-xs">Regionally grounded pricing</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
