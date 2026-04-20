import { Alert, ActionSheetIOS, Platform } from "react-native";
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

async function openCamera(
  copy: DocumentCapturePromptCopy,
  onPickedFile: (fileUri: string, mimeType: string) => void,
): Promise<void> {
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
}

async function openPhotoLibrary(
  onPickedFile: (fileUri: string, mimeType: string) => void,
): Promise<void> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Photos access needed",
      "Allow photo library access in Settings to pick existing pictures of receipts and documents.",
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsMultipleSelection: false,
  });

  if (!result.canceled && result.assets[0]) {
    const asset = result.assets[0];
    const mime = asset.mimeType?.startsWith("image/")
      ? asset.mimeType
      : "image/jpeg";
    onPickedFile(asset.uri, mime);
  }
}

async function openDocumentPicker(
  onPickedFile: (fileUri: string, mimeType: string) => void,
): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
  });

  if (!result.canceled && result.assets[0]) {
    const asset = result.assets[0];
    onPickedFile(asset.uri, asset.mimeType || "image/jpeg");
  }
}

/**
 * Shows camera, photo library, or files and returns the chosen file to the
 * callback. Does not upload — call `uploadPickedDocumentToProject` next.
 */
export function presentDocumentCapturePrompt(
  copy: DocumentCapturePromptCopy,
  onPickedFile: (fileUri: string, mimeType: string) => void,
): void {
  const run = (action: () => Promise<void>) => () => {
    void action();
  };

  if (Platform.OS === "ios") {
    const labels = [
      "Cancel",
      "Take Photo",
      "Photo Library",
      copy.pickFilesLabel,
    ] as const;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: copy.title,
        message: copy.message,
        options: [...labels],
        cancelButtonIndex: 0,
        userInterfaceStyle: "light",
      },
      (index) => {
        if (index === 1) void openCamera(copy, onPickedFile);
        else if (index === 2) void openPhotoLibrary(onPickedFile);
        else if (index === 3) void openDocumentPicker(onPickedFile);
      },
    );
    return;
  }

  // Android (and other platforms): Alert supports at most three buttons — three sources; dismiss with the system back control.
  Alert.alert(copy.title, copy.message, [
    { text: "Take Photo", onPress: run(() => openCamera(copy, onPickedFile)) },
    {
      text: "Photo Library",
      onPress: run(() => openPhotoLibrary(onPickedFile)),
    },
    {
      text: copy.pickFilesLabel,
      onPress: run(() => openDocumentPicker(onPickedFile)),
    },
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
