import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import type { ProjectTypeOption } from "@/types/onboarding";
import { PROJECT_TYPE_ICON } from "@/lib/onboarding-icons";

const options: ProjectTypeOption[] = [
  "Kitchen",
  "Bathroom",
  "Painting",
  "Roof",
  "Flooring",
  "Something else",
];

export function ProjectTypeScreen() {
  const navigate = useNavigate();
  const { projectType, setProjectType } = useOnboarding();

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What are you working on first?
          </h2>
          <p className="text-slate-500">You can add more projects later.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt) => {
            const Icon = PROJECT_TYPE_ICON[opt];
            const selected = projectType === opt;
            return (
              <Card
                key={opt}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setProjectType(opt);
                  }
                }}
                className={`cursor-pointer card-hover border-2 transition-all duration-300 ${
                  selected
                    ? "border-indigo-600 ring-4 ring-indigo-50 shadow-md bg-indigo-50/10 scale-[1.02]"
                    : "border-slate-100 hover:border-indigo-200"
                }`}
                onClick={() => setProjectType(opt)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center gap-3 min-h-[6.5rem] text-center">
                  <div
                    className={`rounded-2xl p-3 transition-colors duration-300 ${
                      selected
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} aria-hidden />
                  </div>
                  <span className={`font-semibold text-sm leading-tight transition-colors ${
                    selected ? "text-indigo-900" : "text-slate-600"
                  }`}>
                    {opt}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Button
          size="lg"
          variant="primary"
          className="w-full"
          disabled={!projectType}
          onClick={() => navigate("/onboarding/location")}
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
        </Button>
      </div>
    </PageTransition>
  );
}
