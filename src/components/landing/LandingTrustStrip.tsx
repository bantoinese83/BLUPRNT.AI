import { ShieldCheck, FileOutput, Scale } from "lucide-react";
import { LANDING_TRUST_PILLS } from "./landing-content";

const ICONS = [ShieldCheck, FileOutput, Scale] as const;

export function LandingTrustStrip() {
  return (
    <section
      className="border-b border-slate-200/80 bg-white/80 px-4 py-6 sm:px-6"
      aria-label="Trust and product principles"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
        {LANDING_TRUST_PILLS.map((pill, i) => {
          const Icon = ICONS[i] ?? ShieldCheck;
          return (
            <div
              key={pill.label}
              className="flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-teal-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {pill.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
