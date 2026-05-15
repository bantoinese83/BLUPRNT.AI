import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  useWindowDimensions,
} from "react-native";
import { Camera, X, ChevronDown } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { captureEvent } from "@/lib/posthog";
import { usePhysicalAssets } from "@shared/hooks/use-physical-assets";
import { PHYSICAL_ASSET_CATEGORIES } from "@shared/constants/home-specs";

type AddAssetSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
};

export function AddAssetSheet({
  isOpen,
  onClose,
  onSuccess,
  projectId,
}: AddAssetSheetProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  /** Keep reference preview from eating the whole sheet so the footer stays visible */
  const referencePreviewMaxHeight = Math.min(
    windowWidth - 48,
    Math.round(windowHeight * 0.28),
    240,
  );

  const { saveAsset } = usePhysicalAssets({
    projectId,
    supabase,
    skipFetch: true,
    onError: (err) => {
      console.error(err);
      Alert.alert("Error", "Could not save spec. Please try again.");
    },
  });

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: PHYSICAL_ASSET_CATEGORIES[0].id as string,
    brand: "",
    color_name: "",
    color_code: "",
    finish: "",
    location_in_home: "",
    notes: "",
  });
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]!.uri);
      Haptics.selectionAsync();
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "We need camera access to take photos.");
      return;
    }

    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert(
        "Camera unavailable",
        /simulator|not available|unavailable/i.test(message)
          ? "Use the simulator-friendly Photo Library option, or test on a physical device."
          : "We couldn’t open the camera. Try Photo Library instead.",
      );
      return;
    }

    if (!result.canceled) {
      setImageUri(result.assets[0]!.uri);
      Haptics.selectionAsync();
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert("Missing info", "Please enter a name for this spec.");
      return;
    }

    setLoading(true);
    try {
      let storagePath = null;
      if (imageUri) {
        const fileExt = "jpg";
        const fileName = `${projectId}/assets/${Math.random().toString(36).substring(2)}.${fileExt}`;

        const formDataFile = new FormData();
        formDataFile.append("file", {
          uri: imageUri,
          name: fileName,
          type: "image/jpeg",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const { error: uploadError } = await supabase.storage
          .from("project-photos")
          .upload(fileName, formDataFile);

        if (uploadError) throw uploadError;
        storagePath = fileName;
      }

      const { error } = await saveAsset({
        ...formData,
        storage_path: storagePath,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      captureEvent("asset_created", { category: formData.category });
      onSuccess();
    } catch {
      // Error handled by hook's onError but we catch here to stop execution
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="92%">
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>New Home Spec</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={Theme.colors.text.muted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.kav}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
          <View style={styles.scrollWrap}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.section}>
                <Text style={styles.label}>ASSET NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Living Room Walls"
                  placeholderTextColor={Theme.colors.text.muted + "80"}
                  value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.label}>CATEGORY</Text>
                  <TouchableOpacity
                    style={styles.select}
                    onPress={() => {
                      Alert.alert(
                        "Select Category",
                        "",
                        PHYSICAL_ASSET_CATEGORIES.map((c) => ({
                          text: c.label,
                          onPress: () =>
                            setFormData({ ...formData, category: c.id }),
                        })),
                      );
                    }}
                  >
                    <Text style={styles.selectText}>
                      {PHYSICAL_ASSET_CATEGORIES.find(
                        (c) => c.id === formData.category,
                      )?.label || formData.category}
                    </Text>
                    <ChevronDown size={14} color={Theme.colors.text.muted} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.label}>LOCATION</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kitchen"
                    placeholderTextColor={Theme.colors.text.muted + "80"}
                    value={formData.location_in_home}
                    onChangeText={(t) =>
                      setFormData({ ...formData, location_in_home: t })
                    }
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.label}>BRAND</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Sherwin Williams"
                    placeholderTextColor={Theme.colors.text.muted + "80"}
                    value={formData.brand}
                    onChangeText={(t) => setFormData({ ...formData, brand: t })}
                  />
                </View>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.label}>FINISH</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Eggshell"
                    placeholderTextColor={Theme.colors.text.muted + "80"}
                    value={formData.finish}
                    onChangeText={(t) =>
                      setFormData({ ...formData, finish: t })
                    }
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.label}>COLOR NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Agreeable Gray"
                    placeholderTextColor={Theme.colors.text.muted + "80"}
                    value={formData.color_name}
                    onChangeText={(t) =>
                      setFormData({ ...formData, color_name: t })
                    }
                  />
                </View>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.label}>COLOR CODE</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        fontFamily:
                          Platform.OS === "ios" ? "Menlo" : "monospace",
                      },
                    ]}
                    placeholder="e.g. SW 7029"
                    placeholderTextColor={Theme.colors.text.muted + "80"}
                    value={formData.color_code}
                    onChangeText={(t) =>
                      setFormData({ ...formData, color_code: t })
                    }
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>NOTES</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any extra details..."
                  placeholderTextColor={Theme.colors.text.muted + "80"}
                  multiline
                  numberOfLines={3}
                  value={formData.notes}
                  onChangeText={(t) => setFormData({ ...formData, notes: t })}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>REFERENCE PHOTO</Text>
                {imageUri ? (
                  <View
                    style={[
                      styles.imagePreviewContainer,
                      { maxHeight: referencePreviewMaxHeight },
                    ]}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setImageUri(null)}
                    >
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={handleTakePhoto}
                    >
                      <Camera size={20} color={Theme.colors.text.primary} />
                      <Text style={styles.photoBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={handlePickImage}
                    >
                      <Text style={styles.photoBtnText}>Choose Library</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <Button
            title="Save to Vault"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    minHeight: 0,
  },
  kav: {
    flex: 1,
    minHeight: 0,
  },
  scrollWrap: {
    flex: 1,
    minHeight: 0,
    flexBasis: 0,
  },
  header: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.05)",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
    flexGrow: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: 24,
    gap: 20,
    paddingBottom: 28,
  },
  section: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: Theme.colors.text.muted,
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  input: {
    height: 48,
    backgroundColor: "rgba(148,163,184,0.05)",
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Theme.colors.text.primary,
    fontWeight: "600",
  },
  select: {
    height: 48,
    backgroundColor: "rgba(148,163,184,0.05)",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  photoActions: {
    flexDirection: "row",
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    height: 48,
    backgroundColor: "rgba(148,163,184,0.05)",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(148,163,184,0.2)",
  },
  photoBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: Theme.colors.text.primary,
  },
  imagePreviewContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 10,
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148,163,184,0.12)",
  },
  submitBtn: {
    height: 56,
  },
});
