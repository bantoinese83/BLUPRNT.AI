import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
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

const ONBOARDING_STEPS = [
  { path: "/onboarding/type", label: "Project" },
  { path: "/onboarding/location", label: "Location" },
  { path: "/onboarding/stage", label: "Stage" },
  { path: "/onboarding/photo", label: "Photos" },
  { path: "/onboarding/loading", label: "Analysis" },
  { path: "/onboarding/estimate", label: "Estimate" },
  { path: "/onboarding/signup", label: "Account" },
];

function StepProgress({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate();
  const currentIndex = ONBOARDING_STEPS.findIndex(
    (s) => s.path === currentPath,
  );
  if (currentIndex === -1) return null;

  return (
    <div className="w-full flex flex-col items-center space-y-5 mb-10">
      <div className="relative w-full px-2">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        <motion.div
          className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: currentIndex / (ONBOARDING_STEPS.length - 1) }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />

        <div className="relative z-10 flex justify-between w-full">
          {ONBOARDING_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;

            return (
              <button
                key={step.path}
                type="button"
                onClick={() => idx < currentIndex && navigate(step.path)}
                disabled={idx >= currentIndex}
                className="group flex flex-col items-center gap-2 outline-none"
              >
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor:
                      isActive || isCompleted
                        ? "var(--color-indigo-600)"
                        : "white",
                    borderColor:
                      isActive || isCompleted
                        ? "var(--color-indigo-600)"
                        : "var(--color-slate-200)",
                    scale: isActive ? 1.15 : 1,
                  }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-black transition-all",
                    isCompleted ? "cursor-pointer" : "cursor-default",
                    isActive
                      ? "shadow-[0_0_12px_rgba(79,70,229,0.3)] text-white"
                      : "text-slate-400",
                    isCompleted && "text-white",
                  )}
                >
                  {idx + 1}
                </motion.div>
                <span
                  className={cn(
                    "hidden sm:block text-[9px] uppercase tracking-widest font-black transition-colors",
                    isActive
                      ? "text-indigo-600"
                      : isCompleted
                        ? "text-slate-900"
                        : "text-slate-400",
                  )}
                >
                  {step.label}
                </span>
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
      </Helmet>

      <AppSimpleHeader showSignIn={isWelcome} />

      <div className="flex flex-1 flex-col items-center p-4 sm:p-6">
        <div className="w-full max-w-4xl py-2 mb-6">
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
