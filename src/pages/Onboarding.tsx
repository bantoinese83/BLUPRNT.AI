import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { AnimatePresence } from "motion/react";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { ProjectTypeScreen } from "@/components/onboarding/ProjectTypeScreen";
import { LocationScreen } from "@/components/onboarding/LocationScreen";
import { StageScreen } from "@/components/onboarding/StageScreen";
import { PhotoScreen } from "@/components/onboarding/PhotoScreen";
import { TextScopeScreen } from "@/components/onboarding/TextScopeScreen";
import { LoadingScreen } from "@/components/onboarding/LoadingScreen";
import { EstimateScreen } from "@/components/onboarding/EstimateScreen";
import { SignupScreen } from "@/components/onboarding/SignupScreen";

export default function Onboarding() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4 sm:p-6">
      <Helmet>
        <title>Get Started — BLUPRNT.AI</title>
        <meta name="description" content="Get a real-world renovation cost estimate in minutes. Start your home project with the right financial baseline." />
      </Helmet>

      <div className="w-full max-w-md relative">
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
  );
}
