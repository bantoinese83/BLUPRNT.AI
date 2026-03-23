import { useNavigate } from "react-router-dom";
import { ArrowRight, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";

const QUICK_CHIPS: Record<string, string[]> = {
  Kitchen: [
    "Replace cabinets",
    "New countertops",
    "Full remodel",
    "Add island",
    "Update backsplash",
    "New appliances",
  ],
  Bathroom: [
    "Replace vanity",
    "New tile",
    "Full remodel",
    "Update fixtures",
    "Add shower",
    "New tub",
  ],
  Other: [
    "General renovation",
    "Cosmetic updates",
    "Structural changes",
    "Multiple rooms",
  ],
};

export function TextScopeScreen() {
  const navigate = useNavigate();
  const {
    scopeDescription,
    setScopeDescription,
    projectType,
  } = useOnboarding();

  const chips = QUICK_CHIPS[projectType ?? "Other"] ?? QUICK_CHIPS.Other;

  function addChip(text: string) {
    const current = scopeDescription.trim();
    const addition = current ? `, ${text}` : text;
    setScopeDescription(current + addition);
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Describe what you want to do
          </h2>
          <p className="text-slate-500">
            Add a few details so we can build a better estimate.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => addChip(label)}
                className="px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-600 text-sm hover:border-slate-400 hover:bg-slate-50 transition-colors"
              >
                + {label}
              </button>

            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="scope-desc" className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <PenLine className="w-4 h-4" aria-hidden />
            Your description
          </label>
          <textarea
            id="scope-desc"
            value={scopeDescription}
            onChange={(e) => setScopeDescription(e.target.value)}
            placeholder="e.g. Replace cabinets, new quartz countertops, and update the backsplash"
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent resize-none"
          />

          <p className="text-xs text-slate-500">
            {scopeDescription.length}/2000 characters
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          className="w-full"
          onClick={() => navigate("/onboarding/loading")}
          type="button"
        >
          Get estimate
          <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
        </Button>
      </div>
    </PageTransition>
  );
}
