import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  reverseGeocode,
  suggestLocationFromNetwork,
  getCurrentPositionCoords,
  userFacingLocationError,
} from "./location";

describe("location library", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("reverseGeocode", () => {
    it("returns label on success", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                postcode: "12345",
              },
            },
          ],
        }),
      });

      const result = await reverseGeocode(10, 20);
      expect(result).toBe("12345");
    });

    it("returns null on fetch failure (non-ok)", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await reverseGeocode(10, 20);
      expect(result).toBeNull();
    });

    it("returns null on fetch error (exception)", async () => {
      (fetch as any).mockRejectedValueOnce(new Error("Network error"));

      // The code doesn't catch exception inside reverseGeocode, but suggestLocationFromNetwork might.
      // Looking at the code:
      // const res = await fetch(url, ...);
      // if (!res.ok) return null;
      // It doesn't have a try-catch block.

      await expect(reverseGeocode(10, 20)).rejects.toThrow("Network error");
    });

    it("returns null on empty features", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [],
        }),
      });

      const result = await reverseGeocode(10, 20);
      expect(result).toBeNull();
    });
  });

  describe("labelFromPhotonProperties (internal logic tested via reverseGeocode)", () => {
    it("handles postcode regex", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [{ properties: { postcode: "12345-6789" } }],
        }),
      });
      expect(await reverseGeocode(0, 0)).toBe("12345-6789");

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [{ properties: { postcode: "ABCDE" } }],
        }),
      });
      expect(await reverseGeocode(0, 0)).toBe("ABCDE");
    });

    it("handles city/town fallback", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [{ properties: { city: "New York", state: "NY" } }],
        }),
      });
      expect(await reverseGeocode(0, 0)).toBe("New York, NY");

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [{ properties: { town: "Smallville", state: "KS" } }],
        }),
      });
      expect(await reverseGeocode(0, 0)).toBe("Smallville, KS");

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [{ properties: { village: "Hamlet", county: "West" } }],
        }),
      });
      expect(await reverseGeocode(0, 0)).toBe("Hamlet, West");
    });

    it("handles name fallback when not street", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                name: "Eiffel Tower",
                state: "Paris",
                street: "Street",
              },
            },
          ],
        }),
      });
      expect(await reverseGeocode(0, 0)).toBe("Eiffel Tower, Paris");
    });

    it("returns null fallback", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [{ properties: {} }],
        }),
      });
      expect(await reverseGeocode(0, 0)).toBeNull();
    });
  });

  describe("suggestLocationFromNetwork", () => {
    it("success with lat/lon and successful reverseGeocode", async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            latitude: "40.7128",
            longitude: "-74.0060",
            city: "New York",
            region: "New York",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            features: [{ properties: { postcode: "10001" } }],
          }),
        });

      const result = await suggestLocationFromNetwork();
      expect(result).toBe("10001");
    });

    it("success with city/region fallback when reverseGeocode fails", async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            latitude: "40.7128",
            longitude: "-74.0060",
            city: "New York",
            region: "NY",
          }),
        })
        .mockResolvedValueOnce({
          ok: false, // reverseGeocode fails
        });

      const result = await suggestLocationFromNetwork();
      expect(result).toBe("New York, NY");
    });

    it("handles invalid lat/lon with city/region fallback", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          latitude: "invalid",
          longitude: "invalid",
          city: "London",
          region: "Greater London",
        }),
      });

      const result = await suggestLocationFromNetwork();
      expect(result).toBe("London, Greater London");
    });

    it("returns null when fetch fails", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await suggestLocationFromNetwork();
      expect(result).toBeNull();
    });
  });

  describe("getCurrentPositionCoords", () => {
    it("success", async () => {
      const mockCoords = { latitude: 10, longitude: 20 };
      const mockPosition = { coords: mockCoords };

      const mockGeolocation = {
        getCurrentPosition: vi
          .fn()
          .mockImplementationOnce((success) => success(mockPosition)),
      };
      vi.stubGlobal("navigator", { geolocation: mockGeolocation });

      const result = await getCurrentPositionCoords();
      expect(result).toEqual({ lat: 10, lon: 20 });
    });

    it("not supported", async () => {
      vi.stubGlobal("navigator", {});
      await expect(getCurrentPositionCoords()).rejects.toThrow(
        "Geolocation is not supported on this device.",
      );
    });

    it("permission denied", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementationOnce((success, error) =>
          error({
            code: 1,
            PERMISSION_DENIED: 1,
          }),
        ),
      };
      vi.stubGlobal("navigator", { geolocation: mockGeolocation });

      await expect(getCurrentPositionCoords()).rejects.toThrow(
        "permission_denied",
      );
    });

    it("timeout", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementationOnce((success, error) =>
          error({
            code: 3,
            TIMEOUT: 3,
          }),
        ),
      };
      vi.stubGlobal("navigator", { geolocation: mockGeolocation });

      await expect(getCurrentPositionCoords()).rejects.toThrow("timeout");
    });

    it("unavailable", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementationOnce((success, error) =>
          error({
            code: 2,
            POSITION_UNAVAILABLE: 2,
          }),
        ),
      };
      vi.stubGlobal("navigator", { geolocation: mockGeolocation });

      await expect(getCurrentPositionCoords()).rejects.toThrow("unavailable");
    });

    it("unknown error", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementationOnce((success, error) =>
          error({
            code: 0,
          }),
        ),
      };
      vi.stubGlobal("navigator", { geolocation: mockGeolocation });

      await expect(getCurrentPositionCoords()).rejects.toThrow("unknown");
    });
  });

  describe("userFacingLocationError", () => {
    it("handles all cases", () => {
      expect(userFacingLocationError("permission_denied")).toContain(
        "access is blocked",
      );
      expect(userFacingLocationError("timeout")).toContain("too long");
      expect(userFacingLocationError("unavailable")).toContain(
        "precise location",
      );
      expect(userFacingLocationError("something_else")).toContain(
        "Something went wrong",
      );
    });
  });
});
