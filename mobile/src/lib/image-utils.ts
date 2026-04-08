import * as ImageManipulator from "expo-image-manipulator";

/**
 * Compresses images for `photo-to-scope` (Edge ~150s wall clock on free tier).
 * ~1200px max edge + JPEG 0.65 keeps payloads small so Gemini finishes in time.
 */
export async function compressImageForAnalysis(uri: string) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch (error) {
    console.error("Image compression failed:", error);
    return uri; // Return original if compression fails
  }
}
