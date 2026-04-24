import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  History,
  Play,
  Plus,
  Camera,
  X,
  MessageSquare,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { supabase, invokeFunction } from "@/lib/supabase";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAwareness } from "@/contexts/AwarenessContext";
import { useDashboardData } from "@/hooks/useDashboardData";

type GalleryItem = import("@shared/types/database").GalleryItemRow;

type TransformationVaultProps = {
  projectId: string;
  className?: string; // For compatibility with web props if needed
};

type PhotoSlotProps = {
  label: string;
  icon: React.ReactNode;
  item: GalleryItem | null;
  signedUrl: string | null;
  uploading: boolean;
  onUpload: () => void;
  onClear: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
};

function PhotoSlot({
  label,
  icon,
  item,
  signedUrl,
  uploading,
  onUpload,
  onClear,
  onUpdateCaption,
}: PhotoSlotProps) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(item?.caption || "");

  useEffect(() => {
    setCaptionValue(item?.caption || "");
  }, [item?.caption]);

  const showPlaceholder = !signedUrl || !item;

  const handleSaveCaption = async () => {
    if (!item) return;
    try {
      await onUpdateCaption(item.id, captionValue);
      setEditingCaption(false);
    } catch {
      setCaptionValue(item.caption || "");
    }
  };

  return (
    <View style={styles.slotContainer}>
      <GlassCard intensity={8} style={styles.slotCard}>
        <View style={{ flex: 1 }}>
          {showPlaceholder ? (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                {uploading ? (
                  <ActivityIndicator color={Theme.colors.brand.primary} />
                ) : (
                  <ImageIcon size={24} color={Theme.colors.text.disabled} />
                )}
              </View>
              <Text style={styles.placeholderLabel}>{label}</Text>
            </View>
          ) : (
            <View style={StyleSheet.absoluteFill}>
              <Image
                source={{ uri: signedUrl! }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />

              {/* Controls Overlay (Top) */}
              <View style={styles.topControls}>
                <TouchableOpacity
                  onPress={() => setEditingCaption(!editingCaption)}
                  style={[
                    styles.controlBtn,
                    editingCaption && styles.controlBtnActive,
                  ]}
                >
                  <MessageSquare size={14} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onClear(item.id)}
                  style={[styles.controlBtn, styles.clearBtn]}
                >
                  <X size={14} color="white" />
                </TouchableOpacity>
              </View>

              {/* Caption Overlay (Bottom) */}
              {!editingCaption && item.caption && (
                <View style={styles.captionContainer}>
                  <Text style={styles.captionText} numberOfLines={2}>
                    {item.caption}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Label Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              {icon}
              <Text style={styles.badgeText}>{label}</Text>
            </View>
          </View>

          {/* Action Overlay */}
          {!editingCaption && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionOverlay}
              onPress={() => {
                console.log(`[PhotoSlot] Capture pressed for ${label}`);
                onUpload();
              }}
              disabled={uploading}
            >
              <View style={styles.actionBtn}>
                {uploading ? (
                  <ActivityIndicator
                    size="small"
                    color={Theme.colors.brand.primary}
                  />
                ) : (
                  <>
                    <Camera size={16} color={Theme.colors.text.primary} />
                    <Text style={styles.actionText}>
                      {showPlaceholder ? `Capture` : `Change`}
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Inline Caption Editor */}
          {editingCaption && (
            <View style={styles.editorOverlay}>
              <View style={styles.editorContent}>
                <TextInput
                  value={captionValue}
                  onChangeText={setCaptionValue}
                  placeholder="Add a caption..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.captionInput}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleSaveCaption}
                  style={styles.saveBtn}
                >
                  <Check size={18} color={Theme.colors.brand.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </GlassCard>
    </View>
  );
}

export function TransformationVault({ projectId }: TransformationVaultProps) {
  const { galleryItems = [] } = useAwareness();
  const { load: refreshDashboard } = useDashboardData();
  const [uploading, setUploading] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Group items into sets
  const sets = useMemo(() => {
    const safeGallery = Array.isArray(galleryItems) ? galleryItems : [];
    const befores = safeGallery.filter((i) => i.photo_type === "before");
    const afters = safeGallery.filter((i) => i.photo_type === "after");
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
    console.log(
      `[TransformationVault] handlePickPhoto for ${type} at index ${index}`,
    );
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
      console.log(
        `[TransformationVault] Photo picked: ${result.assets[0].uri}`,
      );
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
    }
  };

  const handleUpdateCaption = async (id: string, caption: string) => {
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
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TRANSFORMATION GALLERY</Text>
          <Text style={styles.headerSubtitle}>
            Angle {activeSetIndex + 1} of {sets.length}
          </Text>
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

      <View style={styles.grid}>
        <PhotoSlot
          label="Baseline"
          icon={<History size={10} color="white" />}
          item={sets[activeSetIndex].before}
          signedUrl={
            sets[activeSetIndex].before
              ? signedUrls[sets[activeSetIndex].before!.storage_path]
              : null
          }
          uploading={uploading === `before-${activeSetIndex}`}
          onUpload={() => handlePickPhoto("before", activeSetIndex)}
          onClear={handleClear}
          onUpdateCaption={handleUpdateCaption}
        />
        <PhotoSlot
          label="Current"
          icon={
            <Play
              size={10}
              color={Theme.colors.brand.primary}
              fill={Theme.colors.brand.primary}
            />
          }
          item={sets[activeSetIndex].after}
          signedUrl={
            sets[activeSetIndex].after
              ? signedUrls[sets[activeSetIndex].after!.storage_path]
              : null
          }
          uploading={uploading === `after-${activeSetIndex}`}
          onUpload={() => handlePickPhoto("after", activeSetIndex)}
          onClear={handleClear}
          onUpdateCaption={handleUpdateCaption}
        />
      </View>

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

const styles = StyleSheet.create({
  badgeIcon: {
    marginLeft: 4,
  },
  container: {
    marginTop: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
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
  grid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
  },
  slotContainer: {
    flex: 1,
    aspectRatio: 1,
  },
  slotCard: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Theme.colors.card,
    height: "100%",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    zIndex: 1,
  },
  placeholderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  placeholderLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    marginTop: 10,
    letterSpacing: 1,
  },
  topControls: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
    zIndex: 20,
  },
  controlBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnActive: {
    backgroundColor: Theme.colors.brand.primary,
  },
  clearBtn: {
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  captionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  captionText: {
    color: "white",
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
  },
  badgeContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: Theme.typography.family.black,
    color: "white",
    textTransform: "uppercase",
  },
  actionOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 25,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  actionText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  editorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    zIndex: 30,
  },
  editorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 8,
    width: "100%",
  },
  captionInput: {
    flex: 1,
    color: "white",
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    paddingHorizontal: 8,
    height: 36,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
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
