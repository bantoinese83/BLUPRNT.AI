import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import type { StageOption } from "@/types/onboarding";
import { STAGE_ICON } from "@/lib/onboarding-icons";

const options: StageOption[] = [
  "Just planning",
  "Collecting quotes",
  "Already started work",
];

export function StageScreen() {
  const navigate = useNavigate();
  const { stage, setStage } = useOnboarding();

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Where are you in the process?
          </h2>
        </div>
        <div className="space-y-3">
          {options.map((opt) => {
            const Icon = STAGE_ICON[opt];
            const selected = stage === opt;
            return (
              <Card
                key={opt}
                role="button"
                tabIndex={0}
                className={`cursor-pointer transition-all ${
                  selected
                    ? "border-indigo-600 ring-2 ring-indigo-100"
                    : "hover:border-indigo-300 hover:shadow-md"
                }`}
                onClick={() => setStage(opt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setStage(opt);
                  }
                }}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div
                    className={`rounded-xl p-3 shrink-0 ${
                      selected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <span className="font-medium text-slate-700 flex-1 text-left">
                    {opt}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Button
          size="lg"
          variant="primary"
          className="w-full"
          disabled={!stage}
          onClick={() => navigate("/onboarding/photo")}
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
        </Button>
      </div>
    </PageTransition>
  );
}
