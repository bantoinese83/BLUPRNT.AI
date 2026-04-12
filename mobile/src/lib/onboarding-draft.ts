import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  PhotoToScopeResult,
  ProjectTypeOption,
  StageOption,
} from "@/lib/onboarding-helpers";

const STORAGE_KEY = "@bluprnt/onboarding_draft_v1";
/** Discard stale drafts so an old save never hijacks a new session. */
const MAX_DRAFT_AGE_MS = 1000 * 60 * 60 * 48;

export type OnboardingDraftV1 = {
  v: 1;
  savedAt: number;
  projectType: ProjectTypeOption | null;
  location: string;
  stage: StageOption | null;
  photos: string[];
  scopeDescription: string;
  estimate: {
    min: number;
    max: number;
    scope: PhotoToScopeResult["scope_items"];
    confidence: number;
  } | null;
};

export async function persistOnboardingDraft(
  draft: Omit<OnboardingDraftV1, "savedAt">,
): Promise<void> {
  const payload: OnboardingDraftV1 = {
    ...draft,
    savedAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadOnboardingDraft(): Promise<OnboardingDraftV1 | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraftV1;
    if (parsed?.v !== 1) return null;
    const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
    if (!savedAt || Date.now() - savedAt > MAX_DRAFT_AGE_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearOnboardingDraft(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Where to send a user after they sign in — matches [RootLayoutNav] draft restore logic. */
export async function getPostAuthRedirectHref(): Promise<
  "/onboarding?restoreOnboarding=1" | "/(tabs)"
> {
  const draft = await loadOnboardingDraft();
  return draft ? "/onboarding?restoreOnboarding=1" : "/(tabs)";
}
