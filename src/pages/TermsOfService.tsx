import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Terms of Service — BLUPRNT.AI</title>
        <meta name="description" content="Read the terms and conditions for using BLUPRNT.AI, the home renovation financial OS." />
      </Helmet>

      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />

            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">

              BLUPRNT.AI
            </span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">Back to Home</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Terms of Service</h1>
          <p className="text-slate-500">Last Updated: March 23, 2026</p>
        </header>

        <div className="prose prose-slate prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Agreement to Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              By accessing or using BLUPRNT.AI, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Description of Service</h2>
            <p className="text-slate-600 leading-relaxed">
              BLUPRNT.AI provides an AI-powered platform for construction document analysis, project estimation, and resale value forecasting. We reserve the right to modify or discontinue any part of our service at any time.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. User Accounts</h2>
            <p className="text-slate-600 leading-relaxed">
              You are responsible for maintaining the security of your account and password. BLUPRNT.AI cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Payments and Subscriptions</h2>
            <p className="text-slate-600 leading-relaxed">
              Payments are processed securely through Stripe. Subscriptions renew automatically unless cancelled. One-time purchases (Project Passes) are non-refundable once the AI analysis has been performed.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Intellectual Property</h2>
            <p className="text-slate-600 leading-relaxed">
              The AI models, software, and interface of BLUPRNT.AI are the property of our company. You retain ownership of the documents you upload.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed">
              BLUPRNT.AI provides AI-generated estimates and summaries for informational purposes. Construction costs and resale values are subject to market conditions and local variations. We are not responsible for architectural or financial decisions made based on AI output.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            &copy; 2026 BLUPRNT.AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
