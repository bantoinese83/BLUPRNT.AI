import { describe, it, expect, vi, beforeEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  persistOnboardingDraft,
  loadOnboardingDraft,
  clearOnboardingDraft,
  getPostAuthRedirectHref,
} from "@/lib/onboarding-draft";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("onboarding draft storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists draft with version and timestamp", async () => {
    await persistOnboardingDraft({
      v: 1,
      projectType: null,
      location: "94107",
      stage: null,
      photos: [],
      scopeDescription: "",
      estimate: null,
    });

    const [, payload] = vi.mocked(AsyncStorage.setItem).mock.calls[0];
    const parsed = JSON.parse(payload as string) as {
      v: number;
      location: string;
    };
    expect(parsed.v).toBe(1);
    expect(parsed.location).toBe("94107");
  });

  it("reloads a fresh draft from storage", async () => {
    const raw = JSON.stringify({
      v: 1,
      savedAt: Date.now(),
      projectType: null,
      location: "x",
      stage: null,
      photos: [],
      scopeDescription: "",
      estimate: null,
    });
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(raw);

    const loaded = await loadOnboardingDraft();
    expect(loaded?.location).toBe("x");
  });

  it("returns null for wrong version", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(
      JSON.stringify({ v: 2, savedAt: Date.now() }),
    );
    expect(await loadOnboardingDraft()).toBeNull();
  });

  it("clears draft", async () => {
    await clearOnboardingDraft();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it("getPostAuthRedirectHref routes to onboarding when draft exists", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        projectType: null,
        location: "z",
        stage: null,
        photos: [],
        scopeDescription: "",
        estimate: null,
      }),
    );
    await expect(getPostAuthRedirectHref()).resolves.toBe(
      "/onboarding?restoreOnboarding=1",
    );
  });

  it("getPostAuthRedirectHref routes to tabs when no draft", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    await expect(getPostAuthRedirectHref()).resolves.toBe("/(tabs)");
  });
});
