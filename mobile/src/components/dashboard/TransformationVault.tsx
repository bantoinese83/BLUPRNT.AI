import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";
import * as ImagePicker from "expo-image-picker";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAwareness } from "@/contexts/AwarenessContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PhotoSlot } from "./PhotoSlot";

type TransformationVaultProps = {
  projectId: string;
  className?: string; // For compatibility with web props if needed
};

export function TransformationVault({ projectId }: TransformationVaultProps) {
  const { galleryItems = [] } = useAwareness();
  const { load: refreshDashboard } = useDashboardData();
  const [uploading, setUploading] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear cache when switching projects to manage memory
  useEffect(() => {
    setSignedUrls({});
    setActiveSetIndex(0);
  }, [projectId]);

  useEffect(() => {
    hintTimerRef.current = setTimeout(() => setShowSwipeHint(false), 2800);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  // Group items into sets (Optimized single-pass)
  const sets = useMemo(() => {
    const safeGallery = Array.isArray(galleryItems) ? galleryItems : [];
    const befores = [];
    const afters = [];
    for (const item of safeGallery) {
      if (item.photo_type === "before") befores.push(item);
      else if (item.photo_type === "after") afters.push(item);
    }
    const count = Math.max(befores.length, afters.length, 1);

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({
        before: befores[i] || null,
        after: afters[i] || null,
      });
    }
    const last = result[result.length - 1];
    if (last && (last.before || last.after)) {
      result.push({ before: null, after: null });
    }
    return result;
  }, [galleryItems]);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const safeGallery = Array.isArray(galleryItems) ? galleryItems : [];
      const pathsToFetch = safeGallery
        .map((i) => i.storage_path)
        .filter((path) => !signedUrls[path]);

      if (pathsToFetch.length === 0) return;

      const { data, error } = await supabase.storage
        .from("project-photos")
        .createSignedUrls(pathsToFetch, 3600);

      if (error) {
        console.error(
          "[TransformationVault] Error creating signed URLs:",
          error,
        );
        return;
      }

      if (data) {
        const newUrls: Record<string, string> = { ...signedUrls };
        data.forEach((item) => {
          if (item.signedUrl && item.path) {
            newUrls[item.path] = item.signedUrl;
          }
        });
        setSignedUrls(newUrls);
      }
    };
    fetchSignedUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryItems]);

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

  const activeSet = sets[activeSetIndex]!;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TRANSFORMATION GALLERY</Text>
        </View>
        <View style={styles.navControls}>
          <TouchableOpacity
            disabled={activeSetIndex === 0}
            onPress={() => setActiveSetIndex((prev) => prev - 1)}
            style={[
              styles.navBtn,
              activeSetIndex === 0 && styles.navBtnDisabled,
            ]}
          >
            <ChevronLeft
              size={16}
              color={
                activeSetIndex === 0
                  ? Theme.colors.text.disabled
                  : Theme.colors.text.primary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={activeSetIndex === sets.length - 1}
            onPress={() => setActiveSetIndex((prev) => prev + 1)}
            style={[
              styles.navBtn,
              activeSetIndex === sets.length - 1 && styles.navBtnDisabled,
            ]}
          >
            <ChevronRight
              size={16}
              color={
                activeSetIndex === sets.length - 1
                  ? Theme.colors.text.disabled
                  : Theme.colors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <View style={[styles.tab, styles.activeTab]}>
          <Text style={styles.tabText}>
            Angle {activeSetIndex + 1} of {sets.length}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.swipeContainer}
      >
        <View style={styles.swipeCard}>
          <PhotoSlot
            item={activeSet.before}
            signedUrl={
              activeSet.before
                ? (signedUrls[activeSet.before.storage_path] ?? null)
                : null
            }
            uploading={uploading === `before-${activeSetIndex}`}
            working={workingId === activeSet.before?.id}
            onUpload={() => handlePickPhoto("before", activeSetIndex)}
            onClear={handleClear}
            onUpdateCaption={handleUpdateCaption}
          />
        </View>

        <View style={styles.swipeCard}>
          <PhotoSlot
            item={activeSet.after}
            signedUrl={
              activeSet.after
                ? (signedUrls[activeSet.after.storage_path] ?? null)
                : null
            }
            uploading={uploading === `after-${activeSetIndex}`}
            working={workingId === activeSet.after?.id}
            onUpload={() => handlePickPhoto("after", activeSetIndex)}
            onClear={handleClear}
            onUpdateCaption={handleUpdateCaption}
          />
        </View>
      </ScrollView>

      {/* Swipe Affordance Hint - appears once on first mount */}
      {showSwipeHint && (
        <MotiView
          from={{ opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -4 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.swipeHint}
        >
          <Text style={styles.swipeHintText}>BEFORE</Text>
          <View style={styles.swipeHintLine} />
          <Text style={styles.swipeHintIcon}>↔</Text>
          <View style={styles.swipeHintLine} />
          <Text style={styles.swipeHintText}>AFTER</Text>
        </MotiView>
      )}

      <View style={styles.dotsContainer}>
        {sets.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeSetIndex ? styles.dotActive : null]}
          />
        ))}
      </View>

      {sets.length > 1 && (
        <TouchableOpacity
          onPress={() => setActiveSetIndex(sets.length - 1)}
          style={styles.addSetBtn}
        >
          <Plus size={14} color={Theme.colors.text.secondary} />
          <Text style={styles.addSetText}>Add Another Angle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  navControls: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
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
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Theme.colors.inputBg,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  tabText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    textTransform: "uppercase",
  },
  swipeContainer: {
    paddingHorizontal: 0,
  },
  swipeCard: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
  },
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: -4,
  },
  swipeHintText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.disabled,
    letterSpacing: 1.5,
  },
  swipeHintLine: {
    flex: 1,
    height: 1,
    maxWidth: 40,
    backgroundColor: Theme.colors.divider,
  },
  swipeHintIcon: {
    fontSize: 14,
    color: Theme.colors.text.disabled,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
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
