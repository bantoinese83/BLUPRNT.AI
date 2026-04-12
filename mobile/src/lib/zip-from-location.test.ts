import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Location from "expo-location";
import { resolveZipFromCurrentLocation } from "@/lib/zip-from-location";

vi.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  hasServicesEnabledAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  reverseGeocodeAsync: vi.fn(),
  Accuracy: { Balanced: 2 },
}));

describe("resolveZipFromCurrentLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns denied when permission not granted", async () => {
    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      status: "denied",
    } as never);
    const r = await resolveZipFromCurrentLocation();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("denied");
  });

  it("returns unavailable when location services off", async () => {
    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      status: "granted",
    } as never);
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(false);

    const r = await resolveZipFromCurrentLocation();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unavailable");
  });

  it("returns zip when geocode yields 5 digits", async () => {
    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      status: "granted",
    } as never);
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
    vi.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      coords: { latitude: 1, longitude: 2 },
    } as never);
    vi.mocked(Location.reverseGeocodeAsync).mockResolvedValue([
      { postalCode: "94107" },
    ] as never);

    const r = await resolveZipFromCurrentLocation();
    expect(r).toEqual({ ok: true, zip: "94107" });
  });

  it("returns no_zip when geocode is empty", async () => {
    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      status: "granted",
    } as never);
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
    vi.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      coords: { latitude: 1, longitude: 2 },
    } as never);
    vi.mocked(Location.reverseGeocodeAsync).mockResolvedValue([]);

    const r = await resolveZipFromCurrentLocation();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("no_zip");
  });

  it("returns no_zip when postal is not 5 digits", async () => {
    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      status: "granted",
    } as never);
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
    vi.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      coords: { latitude: 1, longitude: 2 },
    } as never);
    vi.mocked(Location.reverseGeocodeAsync).mockResolvedValue([
      { postalCode: "12" },
    ] as never);

    const r = await resolveZipFromCurrentLocation();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("no_zip");
  });
});
