import { motion } from "motion/react";
import { Camera, Receipt, FileCheck } from "lucide-react";
import { Highlighter } from "@/components/ui/Highlighter";
import {
  LANDING_HIGHLIGHT_COLOR,
  LANDING_HIGHLIGHT_UNDERLINE,
  LANDING_HOW_INTRO,
} from "./landing-content";

const PLAN_DELIVERABLES = [
  { label: "Photos & notes", tag: "Starter budget" },
  { label: "Your zip code", tag: "Local cost range" },
  { label: "The work list", tag: "Line-by-line detail" },
] as const;

const EXECUTE_DELIVERABLES = [
  { label: "Bids & quotes", tag: "Side by side" },
  { label: "Receipt snaps", tag: "We read totals" },
  { label: "Paid invoices", tag: "Plan vs. spent" },
] as const;

const TRANSFER_DELIVERABLES = [
  { label: "For Buyers", tag: "PDF Packet" },
  { label: "For Agents", tag: "One-pager" },
  { label: "For Lenders", tag: "Ledger export" },
] as const;

function DeliverableList({
  rows,
}: {
  rows: readonly { label: string; tag: string }[];
}) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-[280px]">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors"
        >
          <span className="text-xs font-bold text-slate-900 text-left">
            {row.label}
          </span>
          <span className="shrink-0 text-[12px] font-black text-slate-800 bg-slate-200/50 px-2 py-1 rounded-md">
            {row.tag}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LandingHowItWorks() {
  return (
    <section
      id="how"
      className="border-t border-slate-200/80 bg-white px-4 py-20 sm:px-6 scroll-mt-24 sm:scroll-mt-28"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="how-heading"
          className="text-center text-2xl font-bold text-slate-900 sm:text-3xl"
        >
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-slate-800 leading-relaxed">
          {LANDING_HOW_INTRO}{" "}
          <Highlighter
            action="underline"
            color={LANDING_HIGHLIGHT_UNDERLINE}
            strokeWidth={2}
            padding={0}
            iterations={1}
            isView={true}
          >
            Three steps
          </Highlighter>{" "}
          from plan to packet.
        </p>
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          <motion.article
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-slate-100"
          >
            <div className="w-full h-56 mb-8 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200">
              <img
                src="/images/modern_transformation_hero.png"
                alt="Modern Home Exterior"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent" />
            </div>

            <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-900 flex items-center justify-center mb-8 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
              <Camera className="w-10 h-10" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black mb-4 group-hover:text-slate-950 transition-colors">
              <Highlighter
                action="highlight"
                color={LANDING_HIGHLIGHT_COLOR}
                padding={3}
                iterations={1}
                isView={true}
              >
                Plan
              </Highlighter>
            </h3>

            <p className="text-slate-800 text-lg leading-relaxed font-medium mb-6">
              Turn “we should redo this” into a number that matches your zip
              code—not a fantasy from TV.
            </p>

            <DeliverableList rows={PLAN_DELIVERABLES} />
          </motion.article>

          <motion.article
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-slate-100"
          >
            <div className="w-full h-56 mb-8 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200">
              <img
                src="/images/invoice_system_mockup.png"
                alt="Invoice Tracking System"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <div className="flex gap-2 mb-2">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[12px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                    Auto-read receipts
                  </span>
                  <span className="bg-slate-500/20 text-slate-200 text-[12px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                    Smart Sorting
                  </span>
                </div>
              </div>
            </div>

            <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-900 flex items-center justify-center mb-8 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
              <Receipt className="w-10 h-10" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black mb-4 group-hover:text-slate-950 transition-colors">
              <Highlighter
                action="circle"
                color={LANDING_HIGHLIGHT_UNDERLINE}
                strokeWidth={2}
                padding={10}
                isView={true}
              >
                Execute
              </Highlighter>
            </h3>

            <p className="text-slate-800 text-lg leading-relaxed font-medium mb-6">
              Stack bids, receipts, and paid invoices next to that budget—most
              of the typing is on us.
            </p>

            <DeliverableList rows={EXECUTE_DELIVERABLES} />
          </motion.article>

          <motion.article
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-slate-100"
          >
            <div className="w-full h-56 mb-8 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200">
              <img
                src="/images/seller_packet_mockup.png"
                alt="Buyer Handover Packet"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent" />
            </div>

            <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-900 flex items-center justify-center mb-8 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
              <FileCheck className="w-10 h-10" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black mb-4 group-hover:text-slate-950 transition-colors">
              <Highlighter
                action="highlight"
                color={LANDING_HIGHLIGHT_COLOR}
                padding={3}
                iterations={1}
                isView={true}
              >
                Transfer
              </Highlighter>
            </h3>

            <p className="text-slate-800 text-lg leading-relaxed font-medium mb-6">
              Turn your history into downloads people can actually open—not
              another zip of photos.
            </p>

            <DeliverableList rows={TRANSFER_DELIVERABLES} />
          </motion.article>
        </div>
      </div>
    </section>
  );
}
