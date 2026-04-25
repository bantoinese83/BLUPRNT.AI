import { Alert, ActionSheetIOS, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

export type PickedFile = {
  uri: string;
  mimeType?: string;
  /** Original name when available — improves server-side document-type detection. */
  fileName?: string;
};

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
  onPickedFiles: (files: PickedFile[]) => void,
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

  if (!result.canceled && result.assets && result.assets[0]) {
    const asset = result.assets[0]!;
    onPickedFiles([
      {
        uri: asset.uri,
        mimeType: "image/jpeg",
        fileName: asset.fileName ?? undefined,
      },
    ]);
  }
}

async function openPhotoLibrary(
  onPickedFiles: (files: PickedFile[]) => void,
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
    quality: 0.8,
    allowsMultipleSelection: true,
  });

  if (!result.canceled && result.assets) {
    onPickedFiles(
      result.assets.map((a) => ({
        uri: a.uri,
        mimeType: a.mimeType ?? "image/jpeg",
        fileName: a.fileName ?? undefined,
      })),
    );
  }
}

async function openDocumentPicker(
  onPickedFiles: (files: PickedFile[]) => void,
): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    multiple: true,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    onPickedFiles(
      result.assets.map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType || "image/jpeg",
        fileName: asset.name ?? undefined,
      })),
    );
  }
}

/**
 * Shows camera, photo library, or files and returns the chosen file(s) to the
 * callback. Does not upload — call `uploadPickedDocumentToProject` next.
 */
export function presentDocumentCapturePrompt(
  copy: DocumentCapturePromptCopy,
  onPickedFiles: (files: PickedFile[]) => void,
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
        if (index === 1) void openCamera(copy, onPickedFiles);
        else if (index === 2) void openPhotoLibrary(onPickedFiles);
        else if (index === 3) void openDocumentPicker(onPickedFiles);
      },
    );
    return;
  }

  // Android (and other platforms): Alert supports at most three buttons — three sources; dismiss with the system back control.
  Alert.alert(copy.title, copy.message, [
    { text: "Take Photo", onPress: run(() => openCamera(copy, onPickedFiles)) },
    {
      text: "Photo Library",
      onPress: run(() => openPhotoLibrary(onPickedFiles)),
    },
    {
      text: copy.pickFilesLabel,
      onPress: run(() => openDocumentPicker(onPickedFiles)),
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
