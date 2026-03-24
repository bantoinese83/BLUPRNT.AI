import { Shield } from "lucide-react";
import { Highlighter } from "@/components/ui/Highlighter";
import { LANDING_HIGHLIGHT_COLOR, LANDING_STORY_COPY } from "./landing-content";

export function StorySection() {
  return (
    <section className="bg-slate-50 py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-block p-3 rounded-2xl bg-white shadow-sm border border-slate-100 mb-6">
          <Shield className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
          <Highlighter action="highlight" color={LANDING_HIGHLIGHT_COLOR} padding={4} iterations={1} isView>
            {LANDING_STORY_COPY.heading}
          </Highlighter>
        </h2>
        <div className="space-y-4 text-lg text-slate-600 leading-relaxed font-medium">
          {LANDING_STORY_COPY.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
