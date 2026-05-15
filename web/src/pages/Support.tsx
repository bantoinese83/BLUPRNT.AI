import { Link } from "react-router-dom";
import { Mail, MessageCircle, HelpCircle, ArrowLeft } from "lucide-react";
import { PublicPageSEO } from "@/components/seo/PublicPageSEO";
import {
  PUBLIC_SUPPORT_EMAIL,
  WEB_APP_PATH_SUPPORT,
} from "@shared/constants/public-site";
import { buildContactPageJsonLd, buildFaqPageJsonLd } from "@/lib/seo-json-ld";

const SUPPORT_FAQ = [
  {
    question: "How does the AI cost estimate work?",
    answer:
      "BLUPRNT uses your photos and project details together with regional cost context to suggest scope lines and a planning range. Estimates cite regional labor and material sources so you can see what grounds the numbers.",
  },
  {
    question: "How do I track my budget against the estimate?",
    answer:
      "Upload invoices and quotes; the Reconciliation Engine maps line items to your plan and shows Matched, Under, or Over status so you can spot drift early.",
  },
  {
    question: "Can I use my subscription on web and mobile?",
    answer:
      "Yes—sign in with the same account on web and iOS. Web billing uses Stripe; the iOS app uses the App Store via RevenueCat. Projects and documents sync across devices.",
  },
  {
    question: "What is the Home Team directory?",
    answer:
      "BLUPRNT builds a contractor and vendor directory from uploaded invoices, including contact details and spend totals—useful for maintenance and resale documentation.",
  },
  {
    question: "How do I request a refund?",
    answer:
      "For App Store purchases, use Apple’s subscription management. For web (Stripe) purchases, email support and we will help you resolve billing questions.",
  },
] as const;

const SUPPORT_META = {
  title: "Help & Support",
  description:
    "Get help with BLUPRNT estimates, billing, account access, and using the app on web and mobile. Email support with a response in under 24 hours.",
};

export default function Support() {
  const jsonLd = [
    buildContactPageJsonLd({
      path: WEB_APP_PATH_SUPPORT,
      name: SUPPORT_META.title,
      description: SUPPORT_META.description,
      email: PUBLIC_SUPPORT_EMAIL,
    }),
    buildFaqPageJsonLd(SUPPORT_FAQ),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30">
      <PublicPageSEO
        title={SUPPORT_META.title}
        description={SUPPORT_META.description}
        canonicalPath={WEB_APP_PATH_SUPPORT}
        jsonLd={jsonLd}
      />

      <nav
        className="sticky top-0 z-50 border-b border-white/5 bg-white/2 backdrop-blur-xl"
        aria-label="Support"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link
            to="/"
            className="group flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              aria-hidden
            />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/20">
              <span className="text-xs font-black text-white">B.</span>
            </div>
            <span className="font-bold tracking-tight">BLUPRNT.AI Support</span>
          </div>
          <div className="w-20" aria-hidden />
        </div>
      </nav>

      <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-20">
        <header className="mb-16 text-center">
          <h1 className="mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
            How can we help?
          </h1>
          <p className="mx-auto max-th text-lg leading-relaxed text-slate-400">
            Our support team can help with estimates, billing, account access,
            and how to use BLUPRNT on web and mobile.
          </p>
        </header>

        <div className="mb-20 grid gap-6 md:grid-cols-2">
          <div className="group rounded-3xl border border-white/5 bg-white/2 p-8 transition-all hover:border-teal-500/30">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 transition-transform group-hover:scale-110">
              <Mail className="h-6 w-6 text-teal-400" aria-hidden />
            </div>
            <h2 className="mb-2 text-xl font-bold">Email Support</h2>
            <p className="mb-6 italic text-slate-400">
              Response time: under 24h
            </p>
            <a
              href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 font-semibold text-teal-400 transition-colors hover:text-teal-300"
            >
              {PUBLIC_SUPPORT_EMAIL}
            </a>
          </div>

          <Link
            to={{ pathname: "/", hash: "faq" }}
            className="group block rounded-3xl border border-white/5 bg-white/2 p-8 no-underline transition-all hover:border-teal-500/30"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 transition-transform group-hover:scale-110">
              <HelpCircle className="h-6 w-6 text-teal-400" aria-hidden />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Product FAQs</h2>
            <p className="mb-6 italic text-slate-400">
              Answers on the marketing site FAQ section.
            </p>
            <span className="font-semibold text-teal-400 transition-colors group-hover:text-teal-300">
              Browse FAQs on the homepage →
            </span>
          </Link>
        </div>

        <section
          id="faq"
          className="mb-20 scroll-mt-24"
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            className="mb-8 flex items-center gap-3 text-2xl font-bold"
          >
            <MessageCircle className="text-teal-400" aria-hidden />
            Common Questions
          </h2>
          <div className="mx-auto w-full max-th space-y-4">
            {SUPPORT_FAQ.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-white/5 bg-white/2 p-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between">
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  <span
                    className="text-xl font-bold text-teal-400 transition-transform group-open:rotate-180"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 text-base leading-[1.7] text-slate-400">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section
          className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-teal-600/20 to-teal-800/20 p-12 text-center"
          aria-labelledby="contact-heading"
        >
          <h2 id="contact-heading" className="mb-4 text-2xl font-bold">
            Still stuck?
          </h2>
          <p className="mx-auto mb-8 max-th leading-relaxed text-slate-300">
            Email us and someone from the team will get back to you.
          </p>
          <a
            href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 font-bold text-slate-900 shadow-xl shadow-white/10 transition-all hover:scale-105 active:scale-95"
          >
            Contact Support
          </a>
        </section>
      </main>

      <footer
        className="border-t border-white/5 px-4 py-20 text-center"
        role="contentinfo"
      >
        <p className="text-sm italic text-slate-500">
          BLUPRNT.AI is a project by Monarch Labs Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
