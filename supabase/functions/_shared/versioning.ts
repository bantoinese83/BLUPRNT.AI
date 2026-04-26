/**
 * Custom API Versioning Utility
 * 
 * Used to prevent mobile version skew from breaking backend contracts.
 */

export const API_VERSIONS = {
  V1: "2026-04-20", // Initial release
  V2: "2026-04-26", // Async OCR & Semantic Search
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

export function getApiVersion(req: Request): ApiVersion {
  const version = req.headers.get("x-bluprnt-api-version");
  
  if (version === API_VERSIONS.V2) return API_VERSIONS.V2;
  
  // Default to V1 for backwards compatibility if header is missing or old
  return API_VERSIONS.V1;
}

export function isAtLeastVersion(req: Request, version: ApiVersion): boolean {
  const current = getApiVersion(req);
  
  const vList = Object.values(API_VERSIONS);
  return vList.indexOf(current) >= vList.indexOf(version);
}
