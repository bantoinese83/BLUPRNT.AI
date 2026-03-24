import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
    },
  },
} as const;

import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { ProjectRow, ScopeRow } from "@/types/database";
import { money } from "@/lib/formatters";

export default function ProjectView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeRow[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setError("This link doesn’t look right.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !anonKey) {
          setError("This page isn’t available right now. Try again later.");
          return;
        }
        const url = `${supabaseUrl}/functions/v1/get-project-view?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${anonKey}` },
        });

        if (cancelled) return;

        const json = await res.json();

        if (!res.ok) {
          const raw = String(json.error ?? "");
          const friendly =
            res.status === 410 || raw.toLowerCase().includes("expired")
              ? "This link has expired. Ask the owner for a new one."
              : res.status === 404
                ? "We couldn’t find that shared project. The link may be wrong or no longer active."
                : "Something didn’t load. Check your connection and try opening the link again.";
          setError(friendly);
          setLoading(false);
          return;
        }

        setProject(json.project);
        setScopeItems(json.scope_items ?? []);
      } catch {
        if (!cancelled) {
          setError(
            "We couldn’t reach the server. Check your connection and try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, retryCount]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <Loader2
            className="h-10 w-10 animate-spin text-slate-900"
            aria-hidden
          />
          <p className="text-slate-600">Loading project…</p>
        </div>
        <AppSlimFooter className="bg-white/70" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="rounded-2xl bg-amber-100 p-5 text-amber-800">
            <AlertCircle className="mx-auto h-12 w-12" aria-hidden />
          </div>
          <p className="font-medium leading-relaxed text-slate-700">
            {error ?? "Something went wrong"}
          </p>
          <p className="text-sm text-slate-500">
            If you were sent this link, ask them to create a new share link from
            their dashboard.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={() => {
                setLoading(true);
                setError(null);
                setRetryCount((prev) => prev + 1);
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full gap-2" type="button">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                  <img
                    src="/bluprnt_logo.svg"
                    alt="BLUPRNT logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                Go to BLUPRNT.AI
              </Button>
            </Link>
          </div>
          <div className="mt-2">
            <a
              href="mailto:connect@monarch-labs.com"
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-indigo-600"
            >
              Still have issues? Contact us
            </a>
          </div>
        </div>
        <AppSlimFooter className="bg-white/70" />
      </div>
    );
  }

  const conf = project.confidence_score ?? 4.5;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              {project.name}
            </h1>
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-slate-700 hover:bg-slate-50 font-bold tracking-tight"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-100 overflow-hidden shrink-0">
                  <img
                    src="/bluprnt_logo.svg"
                    alt="BLUPRNT logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                BLUPRNT.AI
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8"
      >
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden shadow-lg border-slate-200/60">
            <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                  Estimated total
                </p>
                <div className="text-4xl font-black tracking-tight">
                  {money(
                    project.estimated_min_total,
                    project.estimated_max_total,
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < Math.floor(conf) ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "bg-slate-700"}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-300">
                  {conf}/5 Confidence
                </span>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {scopeItems.length > 0 ? (
                  scopeItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-25 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-[10px] text-slate-500 font-black">
                            {idx + 1}
                          </span>
                          {item.category}
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {item.description}
                        </p>
                        {item.quantity != null && item.unit && (
                          <p className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {item.quantity} {item.unit}
                          </p>
                        )}
                      </div>
                      <div className="font-black text-slate-900 shrink-0 text-lg">
                        {money(item.total_cost_min, item.total_cost_max)}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-slate-500 text-sm text-center max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <Loader2 className="w-6 h-6 text-slate-300" />
                    </div>
                    <p>
                      No detailed line items in this shared view. The owner may
                      still be building their scope.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-center text-xs font-medium text-slate-500"
        >
          Shared project view · Securely generated by BLUPRNT.AI
        </motion.p>
      </motion.main>

      <AppSlimFooter className="mt-auto bg-white/70" />
    </div>
  );
}
