import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

/** Copy for the camera / files sheet (screens differ slightly in tone). */
export type DocumentCapturePromptCopy = {
  title: string;
  message: string;
  /** Second action label, e.g. “Choose Files” vs “Select Files”. */
  pickFilesLabel: string;
  cameraDeniedTitle: string;
  cameraDeniedMessage: string;
};

/**
 * Shows the standard camera vs document-picker flow and returns the chosen file
 * to the callback. Does not upload — call `uploadPickedDocumentToProject` next.
 */
export function presentDocumentCapturePrompt(
  copy: DocumentCapturePromptCopy,
  onPickedFile: (fileUri: string, mimeType: string) => void,
): void {
  Alert.alert(copy.title, copy.message, [
    {
      text: "Take Photo",
      onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(copy.cameraDeniedTitle, copy.cameraDeniedMessage);
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          onPickedFile(result.assets[0].uri, "image/jpeg");
        }
      },
    },
    {
      text: copy.pickFilesLabel,
      onPress: async () => {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          onPickedFile(asset.uri, asset.mimeType || "image/jpeg");
        }
      },
    },
    { text: "Cancel", style: "cancel" },
  ]);
}

export const DOCUMENT_CAPTURE_HOME_COPY: DocumentCapturePromptCopy = {
  title: "Document Capture",
  message:
    "Upload receipts, quotes, or contracts to keep your project benchmarks up to date.",
  pickFilesLabel: "Choose Files",
  cameraDeniedTitle: "Camera access needed",
  cameraDeniedMessage:
    "Allow camera access in your device settings to snap receipts and documents. You can still upload with Choose Files.",
};

export const DOCUMENT_CAPTURE_LEDGER_COPY: DocumentCapturePromptCopy = {
  title: "Upload Document",
  message:
    "Capture a photo of a receipt, quote, or permit to add it to your ledger.",
  pickFilesLabel: "Select Files",
  cameraDeniedTitle: "Permission Error",
  cameraDeniedMessage: "We need camera access to capture documents.",
};
