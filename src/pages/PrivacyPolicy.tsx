import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-slate-500">Last Updated: March 23, 2026</p>
        </header>

        <div className="prose prose-slate prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed">
              We collect information you provide directly to us when you create an account, use our AI extraction tools, or upload construction documents. This includes your name, email address, and any project-related data you choose to share with BLUPRNT.AI.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. How We Use Information</h2>
            <p className="text-slate-600 leading-relaxed">
              We use the information we collect to operate, maintain, and provide the features of BLUPRNT.AI, primarily to power our AI-driven project estimation and document analysis services. We also use your data to communicate with you about updates and support.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Data Security</h2>
            <p className="text-slate-600 leading-relaxed">
              We implement industry-standard security measures to protect your personal and project information. All data is stored securely using Supabase and encrypted in transit. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Sharing of Information</h2>
            <p className="text-slate-600 leading-relaxed">
              We do not sell your personal information. We may share your data with third-party service providers (like Stripe for payments or OpenAI for processing) strictly as needed to provide our services to you.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Your Choices</h2>
            <p className="text-slate-600 leading-relaxed">
              You can access, update, or delete your account information at any time through your dashboard settings. If you have questions about your data, you can contact us at privacy@bluprntai.com.
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
