import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import { registerForPushNotificationsAsync } from "@/lib/push";

vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  AndroidImportance: { MAX: 5 },
}));

vi.mock("expo-device", () => ({
  isDevice: false,
}));

describe("registerForPushNotificationsAsync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null on simulator", async () => {
    const r = await registerForPushNotificationsAsync("user-1");
    expect(r).toBeNull();
  });
});
