import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import {
  ArrowRight,
  BarChart3,
  Home,
  LogIn,
  Receipt,
  Shield,
  Sparkles,
  UserPlus,
  Camera,
  FileCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

const SITE_URL = getAuthCallbackUrl().replace(/\/auth\/callback$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

export default function Landing() {
  const navigate = useNavigate();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "BLUPRNT",
        description:
          "Turn your renovation into a financial plan. Get real-world costs, track invoices, and build a home improvement record you can hand to buyers.",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "BLUPRNT",
        url: SITE_URL,
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: "BLUPRNT — Home Renovation Financial OS",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: {
          "@type": "Thing",
          name: "Home renovation cost estimation and budgeting",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>BLUPRNT — Turn Your Renovation Into a Financial Plan</title>
        <meta
          name="description"
          content="Get real-world renovation costs, track invoices, and build a home improvement record you can hand to buyers. The homeowner-first financial OS for your next project."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="BLUPRNT — Turn Your Renovation Into a Financial Plan" />
        <meta
          property="og:description"
          content="Get real-world renovation costs, track invoices, and build a home improvement record you can hand to buyers."
        />
        <meta property="og:site_name" content="BLUPRNT" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BLUPRNT — Turn Your Renovation Into a Financial Plan" />
        <meta
          name="twitter:description"
          content="Get real-world renovation costs, track invoices, and build a home improvement record you can hand to buyers."
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all duration-300">
          <nav
            className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"
            aria-label="Main navigation"
          >
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 font-bold text-slate-900 tracking-tight"
            >
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md border border-slate-100 overflow-hidden shrink-0">
                  <img src="/logo.png" alt="BlueprintAI Logo" className="h-7 w-7 object-contain" />
                </div>
                <span className="text-xl font-black italic tracking-tighter">BLUPRNT<span className="text-indigo-600">.AI</span></span>
              </Link>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <LogIn className="mr-2 h-4 w-4" aria-hidden />
                  Sign in
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button size="sm" variant="primary" className="shadow-lg shadow-indigo-200">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </motion.div>
          </nav>
        </header>

        <main>
          {/* Hero */}
          <section
            className="relative overflow-hidden px-4 pt-32 pb-24 sm:px-6 sm:pt-40 sm:pb-32 mesh-bg"
            aria-labelledby="hero-heading"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-transparent to-transparent opacity-60" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <span className="text-[12px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-[0.2em] inline-block mb-2">
                    Home Renovation Financial OS
                  </span>
                  <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                    Turn your renovation into a{" "}
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient-x">
                      financial plan
                    </span>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl text-slate-600 leading-relaxed max-w-xl font-medium"
                >
                  Turn renovations into a trackable financial asset for your home.
                  Get real-world costs, track invoices, and build a record you can
                  hand to buyers.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-4 pt-4"
                >
                  <Button
                    size="lg"
                    className="h-16 px-8 text-lg font-black rounded-2xl premium-gradient shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all text-white border-0"
                    onClick={() => navigate("/onboarding")}
                  >
                    Get my first estimate <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 px-8 text-lg font-black rounded-2xl glass border-slate-200 hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                    onClick={() => navigate("/register")}
                  >
                    <UserPlus className="mr-2 w-6 h-6" /> Create free account
                  </Button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-linear-to-r from-indigo-500/20 to-violet-500/20 rounded-[2.5rem] blur-3xl" />
                <div className="relative glass-card p-2 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <img
                    src="/images/renovation_hero.png"
                    alt="Modern Home Renovation"
                    className="rounded-[2rem] w-full h-auto object-cover shadow-inner"
                  />
                  <div className="absolute bottom-8 left-8 right-8 glass-card p-6 rounded-2xl animate-float">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">AI Cost Analysis</p>
                        <p className="text-xs text-slate-500 font-bold">Regionally grounded pricing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* How it works */}
          <section
            className="border-t border-slate-200/80 bg-white px-4 py-20 sm:px-6"
            aria-labelledby="how-heading"
          >
            <div className="mx-auto max-w-6xl">
              <h2 id="how-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
                How it works
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
                From idea to resale — in three steps.
              </p>
              <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                <motion.article
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-indigo-100"
                >
                  <div className="w-full h-48 mb-8 rounded-2xl overflow-hidden shadow-inner relative">
                    <img src="/images/modern_home_exterior.png" alt="Modern Home" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-linear-to-t from-indigo-900/40 to-transparent" />
                  </div>
                  <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-8 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
                    <Camera className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-indigo-600 transition-colors">Plan</h3>
                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    Turn fuzzy ideas and photos into a realistic, regionally grounded budget.
                  </p>
                </motion.article>

                <motion.article
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-emerald-100"
                >
                  <div className="w-full h-48 mb-8 rounded-2xl overflow-hidden shadow-inner relative">
                    <img src="/images/property_ledger_mockup.png" alt="Invoice Tracking" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-linear-to-t from-emerald-900/40 to-transparent" />
                  </div>
                  <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
                    <Receipt className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-emerald-600 transition-colors">Execute</h3>
                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    Track quotes, actuals, and invoices against that budget with minimal manual work.
                  </p>
                </motion.article>

                <motion.article
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="glass-card hover:bg-white/80 transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 group border-violet-100"
                >
                  <div className="w-full h-48 mb-8 rounded-2xl overflow-hidden shadow-inner relative">
                    <div className="absolute inset-0 bg-linear-to-br from-violet-600 to-indigo-700 p-8 flex flex-col justify-end">
                      <div className="w-16 h-1 bg-white/30 rounded-full mb-4" />
                      <div className="w-32 h-1 bg-white/30 rounded-full mb-4" />
                      <div className="w-24 h-1 bg-white/30 rounded-full" />
                    </div>
                  </div>
                  <div className="w-20 h-20 rounded-3xl bg-violet-50 text-violet-600 flex items-center justify-center mb-8 shadow-inner group-hover:bg-violet-600 group-hover:text-white transition-all duration-500 -mt-16 relative z-10 border-4 border-white">
                    <FileCheck className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-violet-600 transition-colors">Transfer</h3>
                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    Export that history into formats optimized for buyers, agents, and lenders.
                  </p>
                </motion.article>
              </div>
            </div>
          </section>

          {/* Features */}
          <section
            className="border-t border-slate-200/80 bg-slate-50/50 px-4 py-20 sm:px-6"
            aria-labelledby="features-heading"
          >
            <div className="mx-auto max-w-6xl">
              <h2 id="features-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
                Built for homeowners
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
                Not contractors. You — planning, selling, or improving.
              </p>
              <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4" role="list">
                <li className="flex items-start gap-4">
                  <BarChart3 className="h-6 w-6 shrink-0 text-indigo-600" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-slate-900">Photo-to-estimate</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Snap photos, get a grounded cost range in seconds.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Receipt className="h-6 w-6 shrink-0 text-indigo-600" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-slate-900">Invoice tracking</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Upload receipts and quotes — we keep them organized.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Shield className="h-6 w-6 shrink-0 text-indigo-600" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-slate-900">Seller packet</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Document your improvements for buyers and agents.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Home className="h-6 w-6 shrink-0 text-indigo-600" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-slate-900">Property ledger</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Your home’s financial twin — from idea to sale.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Final CTA */}
          <section
            className="border-t border-slate-200/80 bg-white px-4 py-24 sm:px-6"
            aria-labelledby="cta-heading"
          >
            <div className="mx-auto max-w-3xl text-center">
              <h2 id="cta-heading" className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Ready to start?
              </h2>
              <p className="mt-4 text-slate-600">
                Get your first estimate in under a minute. No credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/onboarding">
                  <Button size="lg" variant="primary" className="h-12 px-8 text-base">
                    Get my first estimate
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-slate-100/50 px-4 py-12 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 overflow-hidden">
                <img src="/logo.png" alt="BlueprintAI Logo" className="h-5 w-5 object-contain" />
              </div>
              <span className="font-black italic tracking-tighter text-slate-900">BLUPRNT<span className="text-indigo-600">.AI</span></span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <Link to="/onboarding" className="hover:text-slate-900">Get started</Link>
              <Link to="/login" className="hover:text-slate-900">Sign in</Link>
              <Link to="/register" className="hover:text-slate-900">Create account</Link>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-slate-500">
            © {new Date().getFullYear()} BLUPRNT. Home renovation financial OS for homeowners.
          </p>
        </footer>
      </div>
    </>
  );
}
