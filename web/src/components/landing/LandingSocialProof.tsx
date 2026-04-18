import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Highlighter } from "@/components/ui/Highlighter";
import { LANDING_HIGHLIGHT_COLOR } from "./landing-content";
import { Check } from "lucide-react";

const HONEST_PROOF_LINES = [
  "Regional cost ranges—not a contractor bid or ad",
  "We don’t sell your contact info to pros",
  "Share a read-only link only when you choose",
] as const;

export function LandingSocialProof() {
  const [dbCount, setDbCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => {
        if (typeof count === "number") setDbCount(count);
      });
  }, []);

  return (
    <section className="bg-white border-y border-slate-100 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800">
              <Highlighter
                action="highlight"
                color={LANDING_HIGHLIGHT_COLOR}
                padding={2}
                iterations={1}
                isView={true}
              >
                Trusted by homeowners
              </Highlighter>
            </p>
            <p className="text-2xl font-black text-slate-900">
              {dbCount !== null ? dbCount.toLocaleString() : "…"}{" "}
              <span className="text-slate-800 font-bold">BLUPRNTs managed</span>
            </p>
            <p className="max-w-sm text-center text-xs font-medium leading-relaxed text-slate-800 lg:text-left">
              Count is from real projects in BLUPRNT—not paid endorsements from
              listing or contractor brands.
            </p>
          </div>

          <ul
            className="flex flex-col gap-3 sm:max-w-md lg:pt-1"
            aria-label="What you can expect"
          >
            {HONEST_PROOF_LINES.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
