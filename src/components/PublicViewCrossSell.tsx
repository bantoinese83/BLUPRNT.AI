import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function PublicViewCrossSell() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative mt-12 mb-8 overflow-hidden rounded-3xl bg-slate-900 p-8 text-center text-white shadow-2xl"
    >
      {/* Decorative background blast */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-slate-500/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <Sparkles className="h-6 w-6 text-indigo-300" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">
            Plan your own renovation with AI
          </h3>
          <p className="mx-auto max-w-sm text-slate-400 text-sm leading-relaxed">
            Impressive project, isn't it? Get an AI-powered budget and
            professional line-items for your own home — completely free.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/register">
            <Button
              size="lg"
              className="px-8 font-black bg-white text-slate-900 hover:bg-slate-100 h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Build your BLUPRNT free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          No credit card required · Instant estimates
        </p>
      </div>
    </motion.div>
  );
}
