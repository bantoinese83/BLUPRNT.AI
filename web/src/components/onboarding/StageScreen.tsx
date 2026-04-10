import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import type { StageOption } from "@/types/onboarding";
import { STAGE_ICON } from "@/lib/onboarding-icons";

const options: { id: StageOption; description: string }[] = [
  {
    id: "Just planning",
    description: "Exploring possibilities and getting a rough idea of costs.",
  },
  {
    id: "Collecting quotes",
    description: "Actively talking to contractors and comparing estimates.",
  },
  {
    id: "Already started work",
    description: "Managing an ongoing project and tracking expenses.",
  },
];

export function StageScreen() {
  const navigate = useNavigate();
  const { stage, setStage } = useOnboarding();

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-1.5 sm:space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Where are you in the process?
          </h2>
        </div>
        <div className="space-y-3">
          {options.map((opt) => {
            const Icon = STAGE_ICON[opt.id];
            const selected = stage === opt.id;
            return (
              <Card
                key={opt.id}
                role="button"
                tabIndex={0}
                className={`cursor-pointer border-2 transition-all ${
                  selected
                    ? "border-teal-600 ring-4 ring-teal-50 shadow-lg bg-teal-50/20"
                    : "border-slate-100 hover:border-slate-200 hover:shadow-md bg-white"
                }`}
                onClick={() => setStage(opt.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setStage(opt.id);
                  }
                }}
              >
                <CardContent className="p-5 flex items-center gap-4 relative">
                  <div
                    className={`rounded-xl p-3 shrink-0 ring-1 transition-all ${
                      selected
                        ? "bg-white shadow-sm ring-teal-100"
                        : "bg-white ring-slate-100"
                    }`}
                  >
                    <Icon className="w-8 h-8" aria-hidden />
                  </div>
                  <div className="flex-1 text-left space-y-1 min-w-0">
                    <p
                      className={`font-bold transition-colors ${
                        selected ? "text-teal-950" : "text-slate-800"
                      }`}
                    >
                      {opt.id}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {opt.description}
                    </p>
                  </div>
                  {selected ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-md shadow-teal-200">
                      <Check
                        className="w-5 h-5"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    </div>
                  ) : null}
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
