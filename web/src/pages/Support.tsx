import { Link } from "react-router-dom";
import { Mail, MessageCircle, HelpCircle, ArrowLeft } from "lucide-react";
import { PUBLIC_SUPPORT_EMAIL } from "@shared/constants/public-site";

export default function Support() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-white/2 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-black text-xs">B.</span>
            </div>
            <span className="font-bold tracking-tight">BLUPRNT.AI Support</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-4xl px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            How can we help?
          </h1>
          <p className="mx-auto max-th text-lg leading-relaxed text-slate-400">
            Our support team can help with estimates, billing, account access,
            and how to use BLUPRNT on web and mobile.
          </p>
        </div>

        {/* Quick Help Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <div className="p-8 rounded-3xl bg-white/2 border border-white/5 hover:border-teal-500/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-slate-400 mb-6 italic">
              Response time: &lt; 24h
            </p>
            <a
              href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
              className="text-teal-400 font-semibold hover:text-teal-300 transition-colors inline-flex items-center gap-2"
            >
              {PUBLIC_SUPPORT_EMAIL}
            </a>
          </div>

          <a
            href="#faq"
            className="p-8 rounded-3xl bg-white/2 border border-white/5 hover:border-teal-500/30 transition-all group block no-underline"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">FAQs</h3>
            <p className="text-slate-400 mb-6 italic">
              Answers to common questions — jump to the list below.
            </p>
            <span className="text-teal-400 font-semibold group-hover:text-teal-300 transition-colors">
              Browse FAQs
            </span>
          </a>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="mb-20 scroll-mt-24">
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold">
            <MessageCircle className="text-teal-400" />
            Common Questions
          </h2>
          <div className="mx-auto w-full max-th space-y-4">
            {[
              {
                q: "How does the AI estimate work?",
                a: "BLUPRNT uses your photos and project details together with AI and regional cost context to suggest scope lines and a planning range. Treat it as a budgeting guide—not a contractor bid. Compare any range with local quotes.",
              },
              {
                q: "Can I use my subscription on web and mobile?",
                a: "Yes—sign in with the same account everywhere. Web subscriptions are billed through Stripe; the iOS app is billed through the App Store (via RevenueCat). If you subscribe on both web and iOS, you can be billed twice—cancel the extra subscription where you bought it. The app can warn you if it detects both.",
              },
              {
                q: "How do I request a refund?",
                a: "For purchases made in the iOS app, use Apple’s subscription management or Report a Problem. For web (Stripe) purchases, email support and we’ll help.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group p-6 rounded-2xl bg-white/2 border border-white/5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer">
                  <h4 className="font-semibold text-lg">{faq.q}</h4>
                  <span className="text-teal-400 group-open:rotate-180 transition-transform font-bold text-xl">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-base leading-[1.7] text-slate-400">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div className="p-12 rounded-[2rem] bg-gradient-to-br from-teal-600/20 to-teal-800/20 border border-white/10 text-center">
          <h3 className="text-2xl font-bold mb-4">Still stuck?</h3>
          <p className="mx-auto mb-8 max-th text-slate-300 leading-relaxed">
            Email us and someone from the team will get back to you.
          </p>
          <a
            href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 font-bold text-slate-900 shadow-xl shadow-white/10 transition-all hover:scale-105 active:scale-95"
          >
            Contact Support
          </a>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-20 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm italic">
          BLUPRNT.AI is a project by Monarch Labs Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
