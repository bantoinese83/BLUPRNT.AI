import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { META_ROBOTS_NOINDEX } from "@/lib/seo-meta";
import { AnimatePresence, motion } from "motion/react";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { ProjectTypeScreen } from "@/components/onboarding/ProjectTypeScreen";
import { LocationScreen } from "@/components/onboarding/LocationScreen";
import { StageScreen } from "@/components/onboarding/StageScreen";
import { PhotoScreen } from "@/components/onboarding/PhotoScreen";
import { TextScopeScreen } from "@/components/onboarding/TextScopeScreen";
import { LoadingScreen } from "@/components/onboarding/LoadingScreen";
import { EstimateScreen } from "@/components/onboarding/EstimateScreen";
import { SignupScreen } from "@/components/onboarding/SignupScreen";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AppSimpleHeader } from "@/components/layout/AppSimpleHeader";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { cn } from "@/lib/utils";
import { Check, Home, Calculator, UserPlus } from "lucide-react";

/** Aligned with mobile: three phases, same internal routes. */
const ONBOARDING_PHASES = [
  {
    label: "About project",
    paths: [
      "/onboarding/type",
      "/onboarding/location",
      "/onboarding/stage",
      "/onboarding/photo",
      "/onboarding/text-scope",
    ],
  },
  {
    label: "Your estimate",
    paths: ["/onboarding/loading", "/onboarding/estimate"],
  },
  { label: "Save", paths: ["/onboarding/signup"] },
] as const;

const ONBOARDING_STEPS = [
  { path: "/onboarding/type", label: "Project" },
  { path: "/onboarding/location", label: "Location" },
  { path: "/onboarding/stage", label: "Stage" },
  { path: "/onboarding/photo", label: "Photos" },
  { path: "/onboarding/text-scope", label: "Details" },
  { path: "/onboarding/loading", label: "Analysis" },
  { path: "/onboarding/estimate", label: "Estimate" },
  { path: "/onboarding/signup", label: "Account" },
];

function phaseIndexForPath(pathname: string): number {
  for (let i = ONBOARDING_PHASES.length - 1; i >= 0; i--) {
    for (const p of ONBOARDING_PHASES[i].paths) {
      if (p === pathname) return i;
    }
  }
  return 0;
}

function StepProgress({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate();
  const stepMeta = ONBOARDING_STEPS.find((s) => s.path === currentPath);
  if (!stepMeta) return null;

  const currentIndex = ONBOARDING_STEPS.findIndex(
    (s) => s.path === currentPath,
  );
  const phaseIndex = phaseIndexForPath(currentPath);
  const phasesTotal = ONBOARDING_PHASES.length;

  const remainingSteps = ONBOARDING_STEPS.length - currentIndex - 1;
  const timeLabel =
    remainingSteps <= 0
      ? "Almost done"
      : remainingSteps === 1
        ? "Seconds away"
        : `${Math.ceil(remainingSteps / 2)} min left`;

  const phaseIcons = [Home, Calculator, UserPlus];

  return (
    <div className="w-full flex flex-col items-center space-y-4 mb-8 sm:mb-12">
      <div className="flex w-full justify-between items-end px-1 gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600/60 leading-none">
            {ONBOARDING_PHASES[phaseIndex].label} — {phaseIndex + 1} of{" "}
            {phasesTotal}
          </p>
          <h1 className="text-lg sm:text-xl font-black italic tracking-tighter text-slate-900 leading-none truncate">
            {stepMeta.label}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <Check className="w-2.5 h-2.5 text-teal-500 stroke-[4]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {timeLabel}
          </span>
        </div>
      </div>

      <div className="relative w-full px-1 space-y-2">
        <div className="flex w-full gap-2">
          {ONBOARDING_PHASES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden"
            >
              <motion.div
                className="h-full bg-teal-600 origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i <= phaseIndex ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-10 flex justify-between px-1 pointer-events-none gap-2">
          {ONBOARDING_PHASES.map((phase, idx) => {
            const isCompleted = idx < phaseIndex;
            const isActive = idx === phaseIndex;
            const firstPathInPhase = phase.paths[0];
            const ActiveIcon = phaseIcons[idx] || Home;

            return (
              <button
                key={phase.label}
                type="button"
                onClick={() =>
                  isCompleted && firstPathInPhase && navigate(firstPathInPhase)
                }
                disabled={!isCompleted}
                className={cn(
                  "pointer-events-auto flex-1 flex justify-center",
                  !isCompleted && "cursor-default",
                )}
                aria-label={`Phase ${idx + 1}: ${phase.label}`}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-5 w-5 rounded-full border-2 transition-all duration-300 bg-white",
                    idx > phaseIndex && "border-slate-200",
                    idx <= phaseIndex && "border-transparent",
                    isCompleted && "bg-teal-600 border-teal-600",
                    isActive &&
                      "bg-teal-600 border-teal-100 ring-4 ring-teal-600/10 scale-125",
                  )}
                >
                  {isCompleted && (
                    <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                  )}
                  {isActive && (
                    <ActiveIcon className="w-2.5 h-2.5 text-white animate-in fade-in zoom-in duration-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const location = useLocation();

  const isWelcome =
    location.pathname === "/onboarding" || location.pathname === "/onboarding/";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <Helmet>
        <title>Get Started — BLUPRNT.AI</title>
        <meta
          name="description"
          content="Get a real-world renovation cost estimate in minutes. Start your home project with the right financial baseline."
        />
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
      </Helmet>

      <AppSimpleHeader showSignIn={isWelcome} />

      <div className="flex flex-1 flex-col items-center p-4 sm:p-6">
        <div className="hidden sm:block w-full max-w-4xl py-2 mb-6">
          <Breadcrumbs className="px-2" />
        </div>

        <div className="relative w-full max-w-md">
          {!isWelcome && <StepProgress currentPath={location.pathname} />}

          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/type" element={<ProjectTypeScreen />} />
              <Route path="/location" element={<LocationScreen />} />
              <Route path="/stage" element={<StageScreen />} />
              <Route path="/photo" element={<PhotoScreen />} />
              <Route path="/text-scope" element={<TextScopeScreen />} />
              <Route path="/loading" element={<LoadingScreen />} />
              <Route path="/estimate" element={<EstimateScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
      <AppSlimFooter className="mt-auto shrink-0 bg-white/50" />
    </div>
  );
}
