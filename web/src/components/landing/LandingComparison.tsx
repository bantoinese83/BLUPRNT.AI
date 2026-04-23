import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { COMPARISON_FEATURES } from "./landing-content";

export function LandingComparison() {
  return (
    <section className="py-24 px-4 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Precision Over Guesswork.
          </h2>
          <p className="text-lg text-slate-800 max-w-2xl mx-auto font-medium">
            BLUPRNT pairs regional cost ranges with structured scope, invoices,
            and exports—so homeowners get clearer numbers than a lone
            visualizer, without professional job-site software.
          </p>
        </div>

        <div className="relative overflow-x-auto rounded-2xl border border-slate-200 shadow-xl bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100">
                  Feature
                </th>
                <th className="p-6 text-center border-b border-slate-100 bg-brand-primary/[0.03]">
                  <span className="text-sm font-black text-brand-primary uppercase tracking-widest">
                    BLUPRNT.AI
                  </span>
                </th>
                <th className="p-6 text-center text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100">
                  Visualizers
                </th>
                <th className="p-6 text-center text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100">
                  Pro Tools
                </th>
                <th className="hidden sm:table-cell p-6 text-center text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100">
                  Static Guides
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((feature, idx) => (
                <motion.tr
                  key={feature.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-6 border-b border-slate-100">
                    <span className="font-bold text-slate-900 leading-tight">
                      {feature.name}
                    </span>
                  </td>
                  <td className="p-6 text-center border-b border-slate-100 bg-brand-primary/[0.03]">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                        <Check className="h-5 w-5 text-brand-primary" />
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center border-b border-slate-100">
                    <div className="flex justify-center">
                      {feature.visualizers ? (
                        <Check className="h-5 w-5 text-slate-800" />
                      ) : (
                        <X className="h-5 w-5 text-slate-200" />
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center border-b border-slate-100">
                    <div className="flex justify-center">
                      {feature.proTools ? (
                        <Check className="h-5 w-5 text-slate-800" />
                      ) : (
                        <X className="h-5 w-5 text-slate-200" />
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell p-6 text-center border-b border-slate-100">
                    <div className="flex justify-center">
                      {feature.static ? (
                        <Check className="h-5 w-5 text-slate-800" />
                      ) : (
                        <X className="h-5 w-5 text-slate-200" />
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-slate-800 italic">
            * Comparison based on internal market research of leading consumer
            home improvement platforms.
          </p>
        </div>
      </div>
    </section>
  );
}
