import * as Location from "expo-location";

export type ZipFromLocationResult =
  | { ok: true; zip: string }
  | { ok: false; reason: "denied" | "unavailable" | "no_zip" };

/**
 * Requests foreground location, reverse-geocodes, and returns a 5-digit US-style ZIP when possible.
 */
export async function resolveZipFromCurrentLocation(): Promise<ZipFromLocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    return { ok: false, reason: "unavailable" };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const results = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  const place = results[0];
  if (!place) {
    return { ok: false, reason: "no_zip" };
  }

  const raw = place.postalCode ?? "";
  const digits = raw.replace(/\D/g, "").slice(0, 5);
  if (digits.length !== 5) {
    return { ok: false, reason: "no_zip" };
  }

  return { ok: true, zip: digits };
}
