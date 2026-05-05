import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { MotiView } from "moti";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Plus, ChevronLeft, ChevronRight, Camera } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAwareness } from "@/contexts/AwarenessContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PhotoSlot } from "./PhotoSlot";
import { useTransformationVaultLogic } from "@shared/hooks/use-transformation-vault";
import { UI_CONSTANTS } from "@shared/constants/ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const [beforeAfterPage, setBeforeAfterPage] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compareScrollRef = useRef<ScrollView>(null);

  const { sets, signedUrls } = useTransformationVaultLogic(
    projectId,
    galleryItems,
    supabase,
  );

  // Clear local UI state when switching projects
  useEffect(() => {
    setActiveSetIndex(0);
    setBeforeAfterPage(0);
  }, [projectId]);

  useEffect(() => {
    if (activeSetIndex >= sets.length) {
      setActiveSetIndex(Math.max(0, sets.length - 1));
    }
  }, [sets.length, activeSetIndex]);

  // New angle: start on Before; horizontal scroll reset
  useEffect(() => {
    setBeforeAfterPage(0);
    compareScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [activeSetIndex]);

  const goToComparePage = useCallback((page: 0 | 1) => {
    setBeforeAfterPage(page);
    compareScrollRef.current?.scrollTo({
      x: page * SCREEN_WIDTH,
      animated: true,
    });
  }, []);

  const onCompareScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const page = Math.min(1, Math.max(0, Math.round(x / SCREEN_WIDTH))) as
        | 0
        | 1;
      if (page !== beforeAfterPage) {
        void Haptics.selectionAsync();
      }
      setBeforeAfterPage(page);
    },
    [beforeAfterPage],
  );

  useEffect(() => {
    hintTimerRef.current = setTimeout(
      () => setShowSwipeHint(false),
      UI_CONSTANTS.SWIPE_HINT_DURATION_MS,
    );
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

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

      const { error: fnErr } = await invokeFunction("upload-gallery-photo", {
        body: formData,
      });

      if (fnErr) throw fnErr;
      void refreshDashboard();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to upload photo");
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
  const compareSide: "before" | "after" =
    beforeAfterPage === 0 ? "before" : "after";
  const canReplaceActive =
    compareSide === "before" ? hasBeforePhoto : hasAfterPhoto;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.headerEyebrow}>Transformation</Text>
          <Text style={styles.headerTitle}>Before & after</Text>
          <Text style={styles.headerSubtitle}>
            Angle {activeSetIndex + 1} of {sets.length}
            {sets.length > 1 ? " · Swipe photo or use tabs" : ""}
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

      <View style={styles.segmentWrap}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            beforeAfterPage === 0 && styles.segmentBtnActive,
          ]}
          onPress={() => goToComparePage(0)}
          accessibilityRole="tab"
          accessibilityState={{ selected: beforeAfterPage === 0 }}
        >
          <Text
            style={[
              styles.segmentLabel,
              beforeAfterPage === 0 && styles.segmentLabelActive,
            ]}
          >
            Before
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            beforeAfterPage === 1 && styles.segmentBtnActive,
          ]}
          onPress={() => goToComparePage(1)}
          accessibilityRole="tab"
          accessibilityState={{ selected: beforeAfterPage === 1 }}
        >
          <Text
            style={[
              styles.segmentLabel,
              beforeAfterPage === 1 && styles.segmentLabelActive,
            ]}
          >
            After
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={compareScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        decelerationRate="fast"
        onMomentumScrollEnd={onCompareScrollEnd}
        contentContainerStyle={styles.swipeContainer}
      >
        <View style={styles.swipeCard}>
          <PhotoSlot
            item={activeSet.before}
            signedUrl={beforeUrl}
            uploading={uploading === `before-${activeSetIndex}`}
            working={workingId === activeSet.before?.id}
            onUpload={() => handlePickPhoto("before", activeSetIndex)}
            onClear={handleClear}
            onUpdateCaption={handleUpdateCaption}
            hideChangeOverlay={hasBeforePhoto}
          />
        </View>

        <View style={styles.swipeCard}>
          <PhotoSlot
            item={activeSet.after}
            signedUrl={afterUrl}
            uploading={uploading === `after-${activeSetIndex}`}
            working={workingId === activeSet.after?.id}
            onUpload={() => handlePickPhoto("after", activeSetIndex)}
            onClear={handleClear}
            onUpdateCaption={handleUpdateCaption}
            hideChangeOverlay={hasAfterPhoto}
          />
        </View>
      </ScrollView>

      {showSwipeHint && (
        <MotiView
          from={{ opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -4 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.swipeHint}
        >
          <Text style={styles.swipeHintText}>Swipe on the photo</Text>
          <Text style={styles.swipeHintMid}>·</Text>
          <Text style={styles.swipeHintText}>or tap Before / After</Text>
        </MotiView>
      )}

      {canReplaceActive ? (
        <TouchableOpacity
          style={styles.replaceLink}
          onPress={() =>
            void handlePickPhoto(
              compareSide === "before" ? "before" : "after",
              activeSetIndex,
            )
          }
          disabled={Boolean(uploading)}
          accessibilityLabel={`Replace ${compareSide} photo`}
        >
          <Camera size={14} color={Theme.colors.brand.primary} />
          <Text style={styles.replaceLinkText}>
            Replace {compareSide} photo
          </Text>
        </TouchableOpacity>
      ) : null}

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
  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 3,
    borderRadius: 14,
    backgroundColor: Theme.colors.inputBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 14,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
  },
  segmentLabelActive: {
    color: Theme.colors.brand.primary,
  },
  replaceLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    marginHorizontal: 16,
    paddingVertical: 10,
  },
  replaceLinkText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.brand.primary,
  },
  swipeContainer: {
    paddingHorizontal: 0,
  },
  swipeCard: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  swipeHintText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
  },
  swipeHintMid: {
    fontSize: 11,
    color: Theme.colors.text.disabled,
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
