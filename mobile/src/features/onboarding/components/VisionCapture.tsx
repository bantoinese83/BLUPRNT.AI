import React from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Alert,
  Linking,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { AlertCircle } from "lucide-react-native";
import { Image as ExpoImage } from "expo-image";
import galleryAsset from "@assets/onboarding/gallery.svg";
import cameraAsset from "@assets/onboarding/camera.svg";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import type { OnboardingStyles } from "@/features/onboarding/onboarding-step-types";

interface VisionCaptureProps {
  styles: OnboardingStyles;
  photos: string[];
  setPhotos: Dispatch<SetStateAction<string[]>>;
  scopeDescription: string;
  setScopeDescription: (desc: string) => void;
}

export function VisionCapture({
  styles,
  photos,
  setPhotos,
  scopeDescription,
  setScopeDescription,
}: VisionCaptureProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      key="step3"
      style={styles.visionContainer}
    >
      <Text style={styles.stepTitle}>
        Add any photos and details you have. We’ll handle the estimate.
      </Text>
      <Text style={styles.stepSubtitle}>
        The more you add the tighter the numbers.
      </Text>

      <View style={styles.visionActions}>
        <TouchableOpacity
          style={styles.visionButton}
          onPress={async () => {
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                "Photo access needed",
                "Allow photo library access in Settings so we can analyze your space.",
                [
                  { text: "Not now", style: "cancel" },
                  {
                    text: "Open Settings",
                    onPress: () => {
                      void Linking.openSettings();
                    },
                  },
                ],
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: "images",
              quality: 0.8,
              allowsMultipleSelection: true,
            });
            if (!result.canceled) {
              setPhotos([...photos, ...result.assets.map((a) => a.uri)]);
            }
          }}
        >
          <View
            style={[
              styles.visionIcon,
              { backgroundColor: Theme.colors.brand.primary + "18" },
            ]}
          >
            <ExpoImage
              source={galleryAsset}
              style={styles.visionAsset}
              contentFit="contain"
            />
          </View>
          <Text style={styles.visionLabel}>Gallery</Text>
          <Text style={styles.visionHint}>Upload photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.visionButton}
          onPress={async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                "Camera access needed",
                "Allow camera access in Settings to snap your space.",
                [
                  { text: "Not now", style: "cancel" },
                  {
                    text: "Open Settings",
                    onPress: () => {
                      void Linking.openSettings();
                    },
                  },
                ],
              );
              return;
            }
            let result: ImagePicker.ImagePickerResult;
            try {
              result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                quality: 0.8,
              });
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              Alert.alert(
                "Camera unavailable",
                /simulator|not available|unavailable/i.test(message)
                  ? "Camera isn’t available on the simulator. Use Gallery to upload photos instead."
                  : "We couldn’t open the camera. Try Gallery instead.",
              );
              return;
            }
            if (!result.canceled) setPhotos([...photos, result.assets[0]!.uri]);
          }}
        >
          <View
            style={[
              styles.visionIcon,
              { backgroundColor: Theme.colors.brand.primary + "18" },
            ]}
          >
            <ExpoImage
              source={cameraAsset}
              style={styles.visionAsset}
              contentFit="contain"
            />
          </View>
          <Text style={styles.visionLabel}>Camera</Text>
          <Text style={styles.visionHint}>Snap your space</Text>
        </TouchableOpacity>
      </View>

      {photos.length > 0 && (
        <View style={styles.photoGrid}>
          {photos.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.photoThumb}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPhotos(photos.filter((_, idx) => idx !== i));
              }}
            >
              <Image source={{ uri: p }} style={StyleSheet.absoluteFill} />
              <View style={styles.photoRemoveOverlay}>
                <AlertCircle size={10} color="white" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <GlassCard intensity={15} style={styles.scopeInputCard}>
        <TextInput
          style={styles.scopeInput}
          placeholder="Or describe the project here…"
          placeholderTextColor={Theme.colors.text.secondary}
          multiline
          value={scopeDescription}
          onChangeText={setScopeDescription}
          autoCapitalize="sentences"
          autoCorrect
          maxLength={1000}
          returnKeyType="default"
          accessibilityLabel="Project description"
        />
      </GlassCard>
    </MotiView>
  );
}
