import { Shield } from "lucide-react";
import { Highlighter } from "@/components/ui/Highlighter";
import { LANDING_HIGHLIGHT_COLOR, LANDING_STORY_COPY } from "./landing-content";

export function LandingStory() {
  return (
    <section className="bg-slate-50 py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-block p-3 rounded-2xl bg-white shadow-sm border border-slate-100 mb-6">
          <Shield className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
          <Highlighter
            action="highlight"
            color={LANDING_HIGHLIGHT_COLOR}
            padding={4}
            iterations={1}
            isView={true}
          >
            {LANDING_STORY_COPY.heading}
          </Highlighter>
        </h2>
        <div className="space-y-4 text-lg text-slate-600 leading-relaxed font-medium">
          {LANDING_STORY_COPY.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-12">
          <p className="mb-8 text-center text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:mb-10">
            The BLUPRNT Team
          </p>
          <div className="flex flex-col items-stretch justify-center gap-10 sm:flex-row sm:items-start sm:gap-14 lg:gap-16">
            <figure className="mx-auto flex max-w-[14rem] flex-col items-center text-center sm:mx-0">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-white shadow-xl shadow-slate-300/40 ring-[3px] ring-white sm:h-36 sm:w-36">
                <img
                  src="/headshot-bryan.PNG"
                  alt="Portrait of Bryan Antoine, co-founder of BLUPRNT"
                  aria-label="Bryan Antoine, Co-founder"
                  className="h-full w-full object-cover object-[center_15%]"
                  width={288}
                  height={288}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="mt-4 space-y-0.5">
                <span className="block text-base font-black tracking-tight text-slate-900">
                  Bryan Antoine
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Co-founder
                </span>
              </figcaption>
            </figure>
            <figure className="mx-auto flex max-w-[14rem] flex-col items-center text-center sm:mx-0">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-white shadow-xl shadow-slate-300/40 ring-[3px] ring-white sm:h-36 sm:w-36">
                <img
                  src="/headshot-lauren.PNG"
                  alt="Portrait of Lauren Antoine, co-founder of BLUPRNT"
                  aria-label="Lauren Antoine, Co-founder"
                  className="h-full w-full object-cover object-[center_15%]"
                  width={288}
                  height={288}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="mt-4 space-y-0.5">
                <span className="block text-base font-black tracking-tight text-slate-900">
                  Lauren Antoine
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Co-founder
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
