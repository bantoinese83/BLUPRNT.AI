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

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            What are you working on first?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500"
          >
            You can add more projects later.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:gap-4"
        >
          {options.map((opt) => {
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
                      ? "border-indigo-600 ring-4 ring-indigo-50 shadow-lg bg-indigo-50/10 scale-[1.02]"
                      : "border-slate-100 hover:border-slate-200 hover:shadow-md bg-white shadow-sm"
                  }`}
                  onClick={() => setProjectType(opt)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center gap-3 min-h-[7rem] text-center relative z-10">
                    <div
                      className={`rounded-2xl p-3 transition-all duration-300 ${
                        selected
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      <Icon className="w-6 h-6" strokeWidth={2.5} aria-hidden />
                    </div>
                    <span
                      className={`font-bold text-sm leading-tight transition-colors ${
                        selected ? "text-indigo-950" : "text-slate-600"
                      }`}
                    >
                      {opt}
                    </span>
                  </CardContent>

                  {selected && (
                    <motion.div
                      layoutId="active-bg"
                      className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"
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
            className="w-full h-14 text-base shadow-lg shadow-indigo-500/10 group"
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
