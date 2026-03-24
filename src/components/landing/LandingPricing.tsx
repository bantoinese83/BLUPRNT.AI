import { motion } from "motion/react";
import { Hammer as HammerIcon, CheckCircle2, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingRow {
  feature: string;
  architect: string;
  pass: string;
  hint: string;
}

interface LandingPricingProps {
  /** Architect / Project Pass — not the generic onboarding path */
  onPlanSelect: (plan: "architect" | "pass") => void;
  planComparisonRows: readonly PricingRow[];
}

export function LandingPricing({
  onPlanSelect,
  planComparisonRows,
}: LandingPricingProps) {
  return (
    <section
      id="pricing"
      className="border-t border-slate-200/80 bg-white px-4 py-24 sm:px-6 scroll-mt-24 sm:scroll-mt-28"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2
            id="pricing-heading"
            className="text-3xl font-black text-slate-900 sm:text-4xl italic uppercase tracking-tighter"
          >
            Simple, <span className="text-slate-900">transparent</span> pricing
          </h2>

          <p className="mx-auto max-w-xl text-slate-600 text-lg">
            Protect your renovation investment with the right plan for your
            project.
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
            <div className="absolute -top-6 -right-4 z-20 rotate-[14deg]">
              <div className="relative h-20 w-20 rounded-full border-2 border-slate-900/10 bg-white/90 shadow-[0_14px_30px_rgba(15,23,42,0.18)] ring-4 ring-slate-100/80 backdrop-blur-sm sm:h-24 sm:w-24">
                <img
                  src="/upgrade-icon.svg"
                  alt="Premium upgrade badge"
                  className="h-full w-full object-contain p-2 drop-shadow-[0_4px_10px_rgba(15,23,42,0.18)]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-900 rounded-t-3xl" />
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Architect
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tight text-slate-900">
                  $12
                </span>
                <span className="text-slate-500 font-bold">/mo</span>
              </div>
              <p className="mt-4 text-slate-600 font-medium">
                Professional grade project tracking for active renovators.
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {[
                "Expert AI Insights & Project Strategy",
                "Up to 10 smart invoice scans per billing period",
                "Track up to 2 active projects",
                "Full property ledger & seller packet",
                "Cloud-backed Seller Records (PDF)",
              ].map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-700 font-medium"
                >
                  <HammerIcon className="w-5 h-5 opacity-40 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant="primary"
              size="lg"
              className="w-full h-14 rounded-2xl text-lg font-black liquid-metal-button border-0 shadow-lg shadow-slate-100 group-hover:scale-[1.02] transition-transform"
              onClick={() => onPlanSelect("architect")}
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
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Project Pass
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tight text-slate-900">
                  $49
                </span>
                <span className="text-slate-500 font-bold">/project</span>
              </div>
              <p className="mt-4 text-slate-600 font-medium">
                One-time purchase for a single major remodel.
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {[
                "6 months of Architect features",
                "Unlimited invoices (this project)",
                "Expert AI Insights included",
                "Lifetime read-access to ledger",
                "Perfect for one major remodel",
              ].map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-700 font-medium"
                >
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 rounded-2xl text-lg font-black bg-white border-slate-200 hover:bg-white hover:shadow-lg group-hover:scale-[1.02] transition-transform"
              onClick={() => onPlanSelect("pass")}
            >
              Get a project pass
            </Button>
          </motion.div>
        </div>

        <p className="mt-12 text-center text-slate-500 font-medium italic">
          All plans include a 3-invoice free trial per project. No credit card
          required to start.
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
              <Hammer className="h-3.5 w-3.5" aria-hidden />
              Plans
            </p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Compare at a glance
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
              Same core product — pick monthly for ongoing work, or a pass for
              one big remodel.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 ring-1 ring-slate-100/80">
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <caption className="sr-only">
                  Comparison of Architect subscription and Project Pass for
                  BLUPRNT features
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
                  {planComparisonRows.map((row) => (
                    <tr
                      key={row.feature}
                      className="group border-b border-slate-100/90 transition-colors last:border-0 hover:bg-slate-50/70"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 min-w-[10.5rem] border-r border-slate-100/90 bg-white px-4 py-4 text-left align-top shadow-[4px_0_12px_-6px_rgba(15,23,42,0.08)] transition-colors group-hover:bg-slate-50/95 sm:min-w-[13rem] sm:px-6 sm:py-5"
                      >
                        <span className="block text-sm font-bold text-slate-900">
                          {row.feature}
                        </span>
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
              Project Pass includes Architect features for six months, locked to
              one project. After that, your ledger stays readable — upgrade
              anytime if you start another remodel.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
