/**
 * Chunked Uint8Array → base64 conversion.
 * Shared across Web (seller-packet-appendix) and Mobile (seller-packet-appendix).
 */
const CHUNK_SIZE = 0x8000; // 32 KB — safe for `String.fromCharCode.apply`

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}
