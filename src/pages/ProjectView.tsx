import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Home, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProjectData = {
  id: string;
  name: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
  confidence_score: number | null;
};

type ScopeItem = {
  id: string;
  category: string;
  description: string;
  finish_tier: string | null;
  quantity: number | null;
  unit: string | null;
  total_cost_min: number | null;
  total_cost_max: number | null;
};

function money(a: number | null, b: number | null) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  if (a != null && b != null) return `${fmt(a)} – ${fmt(b)}`;
  if (a != null) return fmt(a);
  return "—";
}

export default function ProjectView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([]);

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
          setError("We couldn’t reach the server. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" aria-hidden />
        <p className="text-slate-600">Loading project…</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-6 max-w-md mx-auto text-center">
        <div className="rounded-2xl bg-amber-100 p-5 text-amber-800">
          <AlertCircle className="w-12 h-12 mx-auto" aria-hidden />
        </div>
        <p className="text-slate-700 font-medium leading-relaxed">{error ?? "Something went wrong"}</p>
        <p className="text-sm text-slate-500">
          If you were sent this link, ask them to create a new share link from their dashboard.
        </p>
        <Link to="/">
          <Button variant="primary" className="gap-2" type="button">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white shadow-sm border border-slate-200 overflow-hidden shrink-0">
              <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain" />
            </div>
            Go to BlueprintAI
          </Button>
        </Link>
      </div>
    );
  }

  const conf = project.confidence_score ?? 4.5;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-700 hover:bg-slate-50 font-bold tracking-tight">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 overflow-hidden shrink-0">
                  <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
                </div>
                BlueprintAI
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card className="overflow-hidden">
          <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-slate-400 text-sm font-medium">Estimated total</p>
              <div className="text-3xl font-bold tracking-tight">
                {money(project.estimated_min_total, project.estimated_max_total)}
              </div>
            </div>
            <div className="text-sm text-slate-400">
              Confidence: {conf}/5
            </div>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {scopeItems.length > 0 ? (
                scopeItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-semibold text-slate-900">{item.category}</h4>
                      <p className="text-sm text-slate-500">{item.description}</p>
                      {item.quantity != null && item.unit && (
                        <p className="text-xs text-slate-500">
                          {item.quantity} {item.unit}
                        </p>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 shrink-0">
                      {money(item.total_cost_min, item.total_cost_max)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-slate-500 text-sm text-center max-w-sm mx-auto">
                  No detailed line items in this shared view. The owner may still be building their scope.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Shared project view · Sign in to create your own estimate
        </p>
      </main>
    </div>
  );
}
