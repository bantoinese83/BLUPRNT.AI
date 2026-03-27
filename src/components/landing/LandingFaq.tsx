import { MessageCircleQuestion } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface LandingFaqProps {
  faqData: readonly FaqItem[];
}

export function LandingFaq({ faqData }: LandingFaqProps) {
  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-slate-200/80 bg-slate-50/80 px-4 py-16 sm:scroll-mt-28 sm:px-6 sm:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 sm:text-[11px]">
            Questions
          </p>
          <h2
            id="faq-heading"
            className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"
          >
            Common questions
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
            Straight answers about estimates, tracking, and who BLUPRNT is for.
          </p>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {faqData.map((item) => (
            <div
              key={item.question}
              className="rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm shadow-slate-200/40 sm:p-6"
            >
              <div className="flex gap-3">
                <MessageCircleQuestion
                  className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500"
                  aria-hidden
                />
                <div className="min-w-0 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                    {item.question}
                  </h3>
                  <div>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
