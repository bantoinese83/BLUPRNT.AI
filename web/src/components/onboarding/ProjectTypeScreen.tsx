import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
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
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 } as const,
  },
} as const;

export function ProjectTypeScreen() {
  const navigate = useNavigate();
  const { projectType, setProjectType } = useOnboarding();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = parseInt(e.key);
      if (key >= 1 && key <= options.length) {
        setProjectType(options[key - 1]!);
      }
      if (e.key === "Enter" && projectType) {
        navigate("/onboarding/location");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [projectType, setProjectType, navigate]);

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            What are you working on?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 flex items-center gap-2"
          >
            You can add more projects later.
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
              Press 1-6 to pick
            </span>
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          {options.map((opt, idx) => {
            const Icon = PROJECT_TYPE_ICON[opt];
            const selected = projectType === opt;
            return (
              <motion.div key={opt} variants={itemVariants}>
                <Card
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setProjectType(opt);
                    }
                  }}
                  className={`relative cursor-pointer overflow-hidden border-2 transition-all duration-300 h-full ${
                    selected
                      ? "border-teal-600 ring-4 ring-teal-50 shadow-lg bg-teal-50/10 scale-[1.02]"
                      : "border-slate-100 hover:border-slate-200 hover:shadow-md bg-white shadow-sm"
                  }`}
                  onClick={() => setProjectType(opt)}
                >
                  <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center gap-2 sm:gap-3 min-h-24 sm:min-h-30 text-center relative z-10">
                    <div className="absolute top-2 right-2 hidden sm:block">
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition-colors ${
                          selected
                            ? "bg-teal-600 text-white border-teal-500"
                            : "bg-slate-50 text-slate-300 border-slate-100"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    <div
                      className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 transition-all duration-300 ${
                        selected
                          ? "bg-white/95 shadow-md shadow-teal-900/10 ring-1 ring-white/60"
                          : "bg-white ring-1 ring-slate-100 shadow-sm"
                      }`}
                    >
                      <Icon className="w-8 h-8 sm:w-9 sm:h-9" aria-hidden />
                    </div>
                    <span
                      className={`font-bold text-xs sm:text-sm leading-tight transition-colors ${
                        selected ? "text-teal-950" : "text-slate-600"
                      }`}
                    >
                      {opt}
                    </span>
                  </CardContent>

                  {selected && (
                    <motion.div
                      layoutId="active-bg"
                      className="absolute inset-0 bg-linear-to-br from-teal-500/5 to-transparent pointer-events-none"
                    />
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            variant="primary"
            className="w-full h-14 text-base shadow-lg shadow-teal-500/10 group"
            disabled={!projectType}
            onClick={() => navigate("/onboarding/location")}
          >
            Continue
            <ArrowRight
              className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
