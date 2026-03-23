/**
 * Approximate location via IP, then precise via device GPS.
 * Reverse geocoding uses Photon (Komoot) — no API key, browser CORS allowed.
 */

const PHOTON_REVERSE = "https://photon.komoot.io/reverse";
const GEOJS = "https://get.geojs.io/v1/ip/geo.json";

function abortAfter(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

type PhotonProps = {
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  name?: string;
  street?: string;
  housenumber?: string;
};

function labelFromPhotonProperties(p: PhotonProps): string | null {
  const zip = p.postcode?.trim();
  if (zip && /^\d{5}(-\d{4})?$/.test(zip)) return zip;
  if (zip) return zip;
  const place =
    p.city || p.town || p.village || (p.name && p.name !== p.street ? p.name : null);
  const region = p.state || p.county;
  if (place && region) return `${place}, ${region}`;
  if (place) return place;
  return null;
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = `${PHOTON_REVERSE}?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&lang=en`;
  const res = await fetch(url, {
    signal: signal ?? abortAfter(10000),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: Array<{ properties?: PhotonProps }>;
  };
  const props = data.features?.[0]?.properties;
  if (!props) return null;
  return labelFromPhotonProperties(props);
}

export type IpGeo = {
  latitude: string;
  longitude: string;
  city?: string;
  region?: string;
  country_code?: string;
};

/**
 * Rough area from IP (no permission). Good enough to pre-fill ZIP or city.
 */
export async function suggestLocationFromNetwork(
  signal?: AbortSignal,
): Promise<string | null> {
  const res = await fetch(GEOJS, {
    signal: signal ?? abortAfter(8000),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as IpGeo;
  const lat = parseFloat(j.latitude);
  const lon = parseFloat(j.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    if (j.city && j.region) return `${j.city}, ${j.region}`;
    return null;
  }
  const fromPhoton = await reverseGeocode(lat, lon, signal);
  if (fromPhoton) return fromPhoton;
  if (j.city && j.region) return `${j.city}, ${j.region}`;
  return null;
}

export function getCurrentPositionCoords(options?: {
  timeoutMs?: number;
  highAccuracy?: boolean;
}): Promise<{ lat: number; lon: number }> {
  const { timeoutMs = 15000, highAccuracy = true } = options ?? {};
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "permission_denied"
            : err.code === err.POSITION_UNAVAILABLE
              ? "unavailable"
              : err.code === err.TIMEOUT
                ? "timeout"
                : "unknown";
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: 600_000, // Reuse location for 10 min
      },
    );
  });
}

export async function suggestLocationFromDeviceGps(options?: {
  timeoutMs?: number;
}): Promise<string | null> {
  const coords = await getCurrentPositionCoords({
    timeoutMs: options?.timeoutMs ?? 18000,
    highAccuracy: true,
  });
  return reverseGeocode(coords.lat, coords.lon, abortAfter(10000));
}

export function userFacingLocationError(code: string): string {
  switch (code) {
    case "permission_denied":
      return "Location access is blocked. Please enter your ZIP code or city manually below.";
    case "timeout":
      return "It took too long to find your location. Try again or enter your area manually.";
    case "unavailable":
      return "We couldn’t determine your precise location (kCLErrorLocationUnknown). ZIP code works best for estimates!";
    default:
      return "Something went wrong with location services. Please enter your area manually.";
  }
}
