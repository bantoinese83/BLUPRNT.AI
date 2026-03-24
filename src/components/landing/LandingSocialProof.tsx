import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Highlighter } from "@/components/ui/Highlighter";
import { LANDING_HIGHLIGHT_COLOR } from "./landing-content";

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
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
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
              {dbCount !== null ? dbCount.toLocaleString() : "..."}{" "}
              <span className="text-slate-500 font-bold">BLUPRNTs managed</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center justify-center font-black italic tracking-tighter text-slate-900 text-xl">
              RE/MAX
            </div>
            <div className="flex items-center justify-center font-black italic tracking-tighter text-slate-900 text-xl">
              Zillow
            </div>
            <div className="flex items-center justify-center font-black italic tracking-tighter text-slate-900 text-xl">
              Better
            </div>
            <div className="flex items-center justify-center font-black italic tracking-tighter text-slate-900 text-xl">
              Houzz
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
