import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Plus, ChevronLeft, ChevronRight, Camera } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAwareness } from "@/contexts/AwarenessContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PhotoSlot } from "./PhotoSlot";
import { useTransformationVaultLogic } from "@shared/hooks/use-transformation-vault";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing";
import { TRANSFORMATION_VAULT_COPY } from "@shared/copy/dashboard";
import { showAppToast } from "@/lib/app-toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
/** Space between Before and After cards (split across column margins). */
const COMPARE_GUTTER = 16;
const COMPARE_SLOT_SIZE = Math.floor((SCREEN_WIDTH - 32 - COMPARE_GUTTER) / 2);

type TransformationVaultProps = {
  projectId: string;
  className?: string; // For compatibility with web props if needed
};

export function TransformationVault({ projectId }: TransformationVaultProps) {
  const { galleryItems = [] } = useAwareness();
  const { load: refreshDashboard } = useDashboardData();
  const [uploading, setUploading] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  const { sets, signedUrls, signedUrlsError, refreshSignedUrls } =
    useTransformationVaultLogic(projectId, galleryItems, supabase);

  // Clear local UI state when switching projects
  useEffect(() => {
    setActiveSetIndex(0);
  }, [projectId]);

  useEffect(() => {
    if (activeSetIndex >= sets.length) {
      setActiveSetIndex(Math.max(0, sets.length - 1));
    }
  }, [sets.length, activeSetIndex]);

  const handlePickPhoto = async (type: "before" | "after", index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Allow photo access to curate your transformation vault.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      void runUpload(result.assets[0].uri, type, index);
    }
  };

  const runUpload = async (
    uri: string,
    type: "before" | "after",
    index: number,
  ) => {
    setUploading(`${type}-${index}`);
    try {
      const ext = uri.split(".").pop() || "jpg";
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("type", type);
      formData.append("file", {
        uri,
        name: `vault_${type}.${ext}`,
        type: `image/${ext === "png" ? "png" : "jpeg"}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const { error: fnErr } = await invokeFunction(
        EDGE_FUNCTIONS.UPLOAD_GALLERY_PHOTO,
        { body: formData },
      );

      if (fnErr) throw fnErr;
      showAppToast(TRANSFORMATION_VAULT_COPY.uploadSuccess, {
        type: "success",
      });
      void refreshDashboard();
    } catch (err) {
      console.error(err);
      Alert.alert("Upload", TRANSFORMATION_VAULT_COPY.uploadFailed);
    } finally {
      setUploading(null);
    }
  };

  const handleClear = async (id: string) => {
    setWorkingId(id);
    try {
      const { error } = await supabase
        .from("project_gallery")
        .delete()
        .eq("id", id);
      if (error) throw error;
      void refreshDashboard();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not remove photo");
    } finally {
      setWorkingId(null);
    }
  };

  const handleUpdateCaption = async (id: string, caption: string) => {
    setWorkingId(id);
    try {
      const { error } = await supabase
        .from("project_gallery")
        .update({ caption })
        .eq("id", id);
      if (error) throw error;
      void refreshDashboard();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not update caption");
      throw err;
    } finally {
      setWorkingId(null);
    }
  };

  const activeSet = sets[Math.min(activeSetIndex, sets.length - 1)]!;

  const beforeUrl = activeSet.before
    ? (signedUrls[activeSet.before.storage_path] ?? null)
    : null;
  const afterUrl = activeSet.after
    ? (signedUrls[activeSet.after.storage_path] ?? null)
    : null;
  const hasBeforePhoto = Boolean(activeSet.before && beforeUrl);
  const hasAfterPhoto = Boolean(activeSet.after && afterUrl);

  const beforePending = Boolean(activeSet.before && !beforeUrl);
  const afterPending = Boolean(activeSet.after && !afterUrl);
  const beforeSlotResolving = Boolean(beforePending && !signedUrlsError);
  const afterSlotResolving = Boolean(afterPending && !signedUrlsError);
  const beforeSlotFailed = Boolean(beforePending && signedUrlsError);
  const afterSlotFailed = Boolean(afterPending && signedUrlsError);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.headerEyebrow}>Home story</Text>
          <Text style={styles.headerTitle}>
            {TRANSFORMATION_VAULT_COPY.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {TRANSFORMATION_VAULT_COPY.strap}
            {" · "}
            Angle {activeSetIndex + 1} of {sets.length}
            {sets.length > 1 ? " · Use arrows for another angle" : ""}
          </Text>
        </View>
        <View style={styles.navControls}>
          <TouchableOpacity
            disabled={activeSetIndex === 0}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveSetIndex((prev) => prev - 1);
            }}
            style={[
              styles.navBtn,
              activeSetIndex === 0 && styles.navBtnDisabled,
            ]}
            accessibilityLabel="Previous angle"
          >
            <ChevronLeft
              size={18}
              color={
                activeSetIndex === 0
                  ? Theme.colors.text.disabled
                  : Theme.colors.text.primary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={activeSetIndex === sets.length - 1}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveSetIndex((prev) => prev + 1);
            }}
            style={[
              styles.navBtn,
              activeSetIndex === sets.length - 1 && styles.navBtnDisabled,
            ]}
            accessibilityLabel="Next angle"
          >
            <ChevronRight
              size={18}
              color={
                activeSetIndex === sets.length - 1
                  ? Theme.colors.text.disabled
                  : Theme.colors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {signedUrlsError ? (
        <View style={styles.urlErrorBanner}>
          <Text style={styles.urlErrorText}>
            {TRANSFORMATION_VAULT_COPY.signedUrlError}
          </Text>
          <TouchableOpacity
            onPress={() => void refreshSignedUrls()}
            style={styles.urlErrorRetry}
            accessibilityRole="button"
            accessibilityLabel={TRANSFORMATION_VAULT_COPY.retry}
          >
            <Text style={styles.urlErrorRetryText}>
              {TRANSFORMATION_VAULT_COPY.retry}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.compareRow}>
        <View
          style={[
            styles.compareCol,
            styles.compareColBefore,
            { width: COMPARE_SLOT_SIZE },
          ]}
        >
          <Text style={styles.compareColLabel}>Before</Text>
          <PhotoSlot
            item={activeSet.before}
            signedUrl={beforeUrl}
            uploading={uploading === `before-${activeSetIndex}`}
            working={workingId === activeSet.before?.id}
            imageResolving={beforeSlotResolving}
            imageLoadFailed={beforeSlotFailed}
            onUpload={() => handlePickPhoto("before", activeSetIndex)}
            onClear={handleClear}
            onUpdateCaption={handleUpdateCaption}
            hideChangeOverlay={hasBeforePhoto}
            slotSize={COMPARE_SLOT_SIZE}
            imageContentFit="contain"
          />
        </View>
        <View
          style={[
            styles.compareCol,
            styles.compareColAfter,
            { width: COMPARE_SLOT_SIZE },
          ]}
        >
          <Text style={[styles.compareColLabel, styles.compareColLabelAfter]}>
            After
          </Text>
          <PhotoSlot
            item={activeSet.after}
            signedUrl={afterUrl}
            uploading={uploading === `after-${activeSetIndex}`}
            working={workingId === activeSet.after?.id}
            imageResolving={afterSlotResolving}
            imageLoadFailed={afterSlotFailed}
            onUpload={() => handlePickPhoto("after", activeSetIndex)}
            onClear={handleClear}
            onUpdateCaption={handleUpdateCaption}
            hideChangeOverlay={hasAfterPhoto}
            slotSize={COMPARE_SLOT_SIZE}
            imageContentFit="contain"
          />
        </View>
      </View>

      {(hasBeforePhoto || hasAfterPhoto) && (
        <View style={styles.replaceRow}>
          {hasBeforePhoto ? (
            <TouchableOpacity
              style={styles.replaceLinkHalf}
              onPress={() => void handlePickPhoto("before", activeSetIndex)}
              disabled={Boolean(uploading)}
              accessibilityLabel="Replace before photo"
            >
              <Camera size={14} color={Theme.colors.brand.primary} />
              <Text style={styles.replaceLinkText}>Replace before</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.replaceLinkSpacer} />
          )}
          {hasAfterPhoto ? (
            <TouchableOpacity
              style={styles.replaceLinkHalf}
              onPress={() => void handlePickPhoto("after", activeSetIndex)}
              disabled={Boolean(uploading)}
              accessibilityLabel="Replace after photo"
            >
              <Camera size={14} color={Theme.colors.brand.primary} />
              <Text style={styles.replaceLinkText}>Replace after</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.replaceLinkSpacer} />
          )}
        </View>
      )}

      <View style={styles.dotsContainer}>
        {sets.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveSetIndex(i);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityLabel={`Angle ${i + 1}`}
          >
            <View
              style={[
                styles.dot,
                i === activeSetIndex ? styles.dotActive : null,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {sets.length > 1 && (
        <TouchableOpacity
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSetIndex(sets.length - 1);
          }}
          style={styles.addSetBtn}
        >
          <Plus size={14} color={Theme.colors.text.secondary} />
          <Text style={styles.addSetText}>Add another angle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitles: {
    flex: 1,
    marginRight: 12,
  },
  urlErrorBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.45)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  urlErrorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.primary,
    lineHeight: 16,
  },
  urlErrorRetry: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Theme.colors.brand.primary,
  },
  urlErrorRetryText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: "#ffffff",
  },
  headerEyebrow: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginTop: 4,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    marginTop: 6,
    lineHeight: 16,
  },
  navControls: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 2,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: {
    backgroundColor: Theme.colors.inputBg,
    borderColor: Theme.colors.divider,
  },
  compareRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 4,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  compareCol: {
    alignItems: "center",
    gap: 8,
  },
  compareColBefore: {
    marginRight: COMPARE_GUTTER / 2,
  },
  compareColAfter: {
    marginLeft: COMPARE_GUTTER / 2,
  },
  compareColLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  compareColLabelAfter: {
    color: "rgba(13, 148, 136, 0.65)",
  },
  replaceRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
    alignItems: "stretch",
  },
  replaceLinkHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    minHeight: 44,
  },
  replaceLinkSpacer: {
    flex: 1,
  },
  replaceLinkText: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.brand.primary,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.divider,
  },
  dotActive: {
    backgroundColor: Theme.colors.brand.primary,
    width: 16,
  },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    alignSelf: "center",
  },
  addSetText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
