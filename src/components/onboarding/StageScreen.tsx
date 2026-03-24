import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
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
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
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
                className={`cursor-pointer transition-all ${
                  selected
                    ? "border-slate-900 ring-2 ring-slate-100"
                    : "hover:border-slate-300 hover:shadow-md"
                }`}
                onClick={() => setStage(opt.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setStage(opt.id);
                  }
                }}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div
                    className={`rounded-xl p-3 shrink-0 ${
                      selected
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="flex-1 text-left space-y-1">
                    <p
                      className={`font-bold transition-colors ${
                        selected ? "text-slate-900" : "text-slate-800"
                      }`}
                    >
                      {opt.id}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {opt.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 text-slate-400 shrink-0"
                    aria-hidden
                  />
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
