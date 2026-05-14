/**
 * Chunked Uint8Array → base64 conversion.
 * Shared across Web (seller-packet-appendix) and Mobile (seller-packet-appendix).
 * Implemented in pure JS to ensure compatibility across Node, Hermes, React Native, and browsers.
 */
const b64Chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function uint8ToBase64(bytes: Uint8Array): string {
  let base64 = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i]!;
    const b2 = i + 1 < len ? bytes[i + 1]! : 0;
    const b3 = i + 2 < len ? bytes[i + 2]! : 0;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    let enc3 = ((b2 & 15) << 2) | (b3 >> 6);
    let enc4 = b3 & 63;

    if (i + 1 >= len) {
      enc3 = enc4 = 64;
    } else if (i + 2 >= len) {
      enc4 = 64;
    }

    base64 +=
      b64Chars.charAt(enc1) +
      b64Chars.charAt(enc2) +
      (enc3 < 64 ? b64Chars.charAt(enc3) : "=") +
      (enc4 < 64 ? b64Chars.charAt(enc4) : "=");
  }
  return base64;
}
