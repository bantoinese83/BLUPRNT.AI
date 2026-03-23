import type { PhotoToScopeResult } from "./estimate";

export type ProjectTypeOption =
  | "Kitchen"
  | "Bathroom"
  | "Painting"
  | "Roof"
  | "Flooring"
  | "Something else";

export type StageOption =
  | "Just planning"
  | "Collecting quotes"
  | "Already started work";

export type OnboardingContextValue = {
  projectType: ProjectTypeOption | null;
  setProjectType: (v: ProjectTypeOption | null) => void;
  locationInput: string;
  setLocationInput: (v: string) => void;
  locationUnset: boolean;
  setLocationUnset: (v: boolean) => void;
  scopeDescription: string;
  setScopeDescription: (v: string) => void;
  stage: StageOption | null;
  setStage: (v: StageOption | null) => void;
  photos: File[];
  setPhotos: (files: File[]) => void;
  estimate: PhotoToScopeResult | null;
  estimateError: string | null;
  estimateLoading: boolean;
  runPhotoToScope: () => Promise<void>;
  persistProjectAfterSignup: (params: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; message: string }>;
  persistProjectAfterSignIn: (params: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; message: string }>;
  savedProjectId: string | null;
  clearOnboarding: () => void;
  projectTypeToDb: (t: ProjectTypeOption | null) => "kitchen" | "bath" | "paint" | "roof" | "flooring" | "other";
  stageToDb: (s: StageOption | null) => "planning" | "collecting_quotes" | "in_progress" | "completed";
  projectDisplayName: (t: ProjectTypeOption | null) => string;
};
