import { motion } from "motion/react";
import { Hammer as HammerIcon, CheckCircle2, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICING } from "@shared/constants/pricing";
import {
  ArchitectPlanIcon,
  ProjectPassIcon,
} from "@/components/icons/PlanMarks";

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
  isArchitect?: boolean;
}

export function LandingPricing({
  onPlanSelect,
  planComparisonRows,
  isArchitect = false,
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

          <p className="mx-auto max-w-xl text-slate-800 text-lg">
            Pick monthly if you’re always fixing something, or a one-time pass
            for one big remodel.
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
            <div className="absolute -top-6 -right-4 z-20 rotate-14">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-900/10 bg-white/90 shadow-[0_14px_30px_rgba(15,23,42,0.18)] ring-4 ring-slate-100/80 backdrop-blur-sm sm:h-24 sm:w-24">
                <ArchitectPlanIcon className="h-14 w-14 sm:h-16 sm:w-16" />
              </div>
            </div>

            <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-900 rounded-t-3xl" />
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-2xl font-black text-slate-900 mb-2">
                <ArchitectPlanIcon className="h-8 w-8" />
                Architect
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tight text-slate-900">
                  ${PRICING.architectUsdPerMonth}
                </span>
                <span className="text-slate-800 font-bold">/mo</span>
              </div>
              <p className="mt-4 text-slate-800 font-medium">
                For people juggling more than one job or always mid-project.
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {[
                "AI coach for budgets, stages, and “wait—what did we pay?”",
                "10 invoice uploads per billing month, total across all projects you track",
                "Up to 2 remodels at the same time",
                "Full home file + listing-ready PDF export",
                "Private Vault for paint lids, tile codes, and finishes",
                "Cloud backup of your packet (PDF)",
              ].map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-700 font-medium"
                >
                  <HammerIcon
                    className="w-5 h-5 shrink-0 text-slate-600"
                    aria-hidden
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={isArchitect ? "outline" : "primary"}
              size="lg"
              disabled={isArchitect}
              className={`w-full h-14 rounded-2xl text-lg font-black ${
                isArchitect
                  ? "bg-slate-50 border-slate-200 text-slate-800 group-hover:scale-100 cursor-default"
                  : "premium-gradient border-0 shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/40 group-hover:scale-[1.02] active:scale-[0.98] transition-all"
              }`}
              onClick={() => !isArchitect && onPlanSelect("architect")}
            >
              {isArchitect ? "Current Plan" : "Subscribe to Architect"}
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
            <div className="absolute -top-6 -right-4 z-20 -rotate-10">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)] ring-4 ring-white/90 sm:h-24 sm:w-24">
                <ProjectPassIcon className="h-14 w-14 sm:h-16 sm:w-16" />
              </div>
            </div>
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-2xl font-black text-slate-900 mb-2">
                <ProjectPassIcon className="h-8 w-8" />
                Project Pass
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tight text-slate-900">
                  ${PRICING.projectPassUsdOneTime}
                </span>
                <span className="text-slate-800 font-bold">/project</span>
              </div>
              <p className="mt-4 text-slate-800 font-medium">
                Pay once for one kitchen, bath, or whole-house gut—after six
                months your project stays view-only for as long as BLUPRNT is
                available.
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {[
                "6 months of everything Architect includes",
                "Unlimited invoice uploads for that one project (while the pass is active)",
                "Same AI help as Architect during those 6 months",
                "After 6 months: your project stays readable (view-only) as long as BLUPRNT is available",
                "Best when you’re not a “forever renovating” household",
              ].map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-700 font-medium"
                >
                  <CheckCircle2
                    className="w-5 h-5 shrink-0 text-teal-900"
                    aria-hidden
                  />
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

        <p className="mt-12 text-center text-slate-800 font-medium italic">
          Free tier: up to 3 invoice uploads per project (quotes and other
          document types don’t count). No credit card required to sign up or run
          an estimate; paid plans are charged at checkout.
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
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-teal-950">
              <Hammer className="h-3.5 w-3.5" aria-hidden />
              Plans
            </p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Compare at a glance
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-800 sm:text-base">
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
                      className="sticky left-0 z-20 min-w-42 bg-linear-to-b from-slate-50 to-slate-50/90 px-4 py-5 text-left align-bottom shadow-[6px_0_14px_-8px_rgba(15,23,42,0.12)] sm:min-w-52 sm:px-6 sm:py-6"
                    >
                      <span className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-800">
                        What you get
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="bg-linear-to-b from-teal-50 to-teal-50/80 px-4 py-5 text-center align-bottom sm:px-6 sm:py-6"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-teal-900">
                          Architect
                        </span>
                        <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[12px] font-black uppercase tracking-wider text-white shadow-sm shadow-teal-900/20">
                          Most flexible
                        </span>
                        <span className="text-sm font-bold tabular-nums text-slate-700">
                          ${PRICING.architectUsdPerMonth}
                          <span className="text-slate-800">/mo</span>
                        </span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="bg-linear-to-b from-slate-50 to-white px-4 py-5 text-center align-bottom sm:px-6 sm:py-6"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-800">
                          Project Pass
                        </span>
                        <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[12px] font-black uppercase tracking-wider text-slate-800">
                          One project
                        </span>
                        <span className="text-sm font-bold tabular-nums text-slate-700">
                          ${PRICING.projectPassUsdOneTime}
                          <span className="text-slate-800"> once</span>
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
                        className="sticky left-0 z-10 min-w-42 border-r border-slate-100/90 bg-white px-4 py-4 text-left align-top shadow-[4px_0_12px_-6px_rgba(15,23,42,0.08)] transition-colors group-hover:bg-slate-50/95 sm:min-w-52 sm:px-6 sm:py-5"
                      >
                        <span className="block text-sm font-bold text-slate-900">
                          {row.feature}
                        </span>
                        <span className="mt-1 block text-xs font-medium leading-snug text-slate-800">
                          {row.hint}
                        </span>
                      </th>
                      <td className="bg-teal-50/35 px-4 py-4 text-center align-top transition-colors group-hover:bg-teal-50/55 sm:px-6 sm:py-5">
                        <span className="inline-block text-sm font-semibold tabular-nums text-teal-950">
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
            <p className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 text-center text-xs leading-relaxed text-slate-800 sm:px-6">
              Project Pass includes Architect features for six months, locked to
              one project. After that, your ledger stays view-only for as long
              as BLUPRNT is available — upgrade anytime if you start another
              remodel.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
