import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export async function compressImageForAnalysis(uri: string) {
  try {
    const result = await manipulateAsync(uri, [{ resize: { width: 1024 } }], {
      compress: 0.8,
      format: SaveFormat.JPEG,
    });
    return result.uri;
  } catch (error) {
    console.warn("Failed to compress image:", error);
    return uri;
  }
}
