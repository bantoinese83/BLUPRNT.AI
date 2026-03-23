import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  ListTree,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  DEFAULT_ESTIMATE_CONFIDENCE,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_MIN,
} from "@/lib/onboarding-helpers";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function EstimateScreen() {
  const navigate = useNavigate();
  const { estimate, estimateError, locationInput } = useOnboarding();

  const summary = estimate?.summary;
  const min = summary?.estimated_min_total ?? DEFAULT_ESTIMATE_MIN;
  const max = summary?.estimated_max_total ?? DEFAULT_ESTIMATE_MAX;
  const conf = summary?.confidence_score ?? DEFAULT_ESTIMATE_CONFIDENCE;
  const area =
    estimate?.area_label ||
    (locationInput.replace(/\D/g, "").length >= 5
      ? `ZIP ${locationInput.replace(/\D/g, "").slice(0, 5)}`
      : "your area");

  const bullets =
    estimate?.scope_items?.slice(0, 8).map((s) => s.category) ?? [
      "Demolition",
      "New cabinets",
      "Countertops",
      "Flooring",
      "Electrical & plumbing adjustments",
    ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Here’s your first estimate
          </h2>
          {estimateError && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 space-y-2">
              <p>{estimate ? "We showed a starting range. Sign in to save and refine." : estimateError}</p>
              {!estimate && (
                <button
                  type="button"
                  className="text-indigo-600 font-medium hover:underline"
                  onClick={() => navigate("/onboarding/loading", { replace: true })}
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        <Card className="border-emerald-200 shadow-md shadow-emerald-100/50 overflow-hidden">
          <div className="bg-emerald-50/50 p-6 border-b border-emerald-100 flex flex-col items-center text-center space-y-2">
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 mb-2 gap-1.5"
            >
              <BadgeCheck className="w-3.5 h-3.5" aria-hidden />
              Confidence: {conf} / 5
            </Badge>
            <p className="text-sm text-slate-600 font-medium">Estimated total</p>
            <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {formatMoney(min)} – {formatMoney(max)}
            </div>
            <p className="text-sm text-slate-500">
              Based on projects like yours in {area}
            </p>
            <p className="text-xs text-slate-500 pt-1">
              This estimate becomes part of your home&apos;s improvement history.
            </p>
          </div>
          <CardContent className="p-6 space-y-4">
            <h4 className="font-semibold text-slate-900">What’s included</h4>
            <ul className="space-y-3">
              {Array.from(new Set(bullets)).map((item, i) => (
                <li
                  key={`${item}-${i}`}
                  className="flex items-start space-x-3 text-sm text-slate-600"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            onClick={() => {
              try {
                sessionStorage.setItem("bluprnt_redirect", "/dashboard/scope");
              } catch {
                /* ignore */
              }
              navigate("/onboarding/signup");
            }}
            type="button"
          >
            <ListTree className="w-5 h-5 shrink-0" aria-hidden />
            See line-by-line costs
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              try {
                sessionStorage.setItem("bluprnt_redirect", "/dashboard/plan");
              } catch {
                /* ignore */
              }
              navigate("/onboarding/signup");
            }}
            type="button"
          >
            <SlidersHorizontal className="w-5 h-5 shrink-0" aria-hidden />
            Adjust the scope
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
