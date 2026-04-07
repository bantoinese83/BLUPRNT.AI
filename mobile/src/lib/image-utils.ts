import * as ImageManipulator from "expo-image-manipulator";

/**
 * Compresses an image to a reasonable size for AI analysis (~1500px max dimension).
 * Reduces payload size and prevents server timeouts.
 */
export async function compressImageForAnalysis(uri: string) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1500 } }], // Maintain aspect ratio
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch (error) {
    console.error("Image compression failed:", error);
    return uri; // Return original if compression fails
  }
}
