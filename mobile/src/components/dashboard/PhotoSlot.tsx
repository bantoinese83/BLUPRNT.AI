import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Camera, X, MessageSquare, Check } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";

type GalleryItem = import("@shared/types/database").GalleryItemRow;

export type PhotoSlotProps = {
  item: GalleryItem | null;
  signedUrl: string | null;
  uploading: boolean;
  working?: boolean;
  /** True while we are fetching a signed URL for an existing gallery row. */
  imageResolving?: boolean;
  /** True when signing failed but the row exists (show recovery hint). */
  imageLoadFailed?: boolean;
  onUpload: () => void;
  onClear: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
  /** When true and a photo is shown, the bottom "Change photo" chip is omitted (parent supplies actions). */
  hideChangeOverlay?: boolean;
  /**
   * Square slot width/height in px. Defaults to nearly full screen width (single-column vault).
   * Use a smaller value for side-by-side before/after rows.
   */
  slotSize?: number;
  /** How the photo fills the slot (default cover). */
  imageContentFit?: "cover" | "contain";
};

export function PhotoSlot({
  item,
  signedUrl,
  uploading,
  working,
  imageResolving = false,
  imageLoadFailed = false,
  onUpload,
  onClear,
  onUpdateCaption,
  hideChangeOverlay = false,
  slotSize,
  imageContentFit = "cover",
}: PhotoSlotProps) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(item?.caption || "");

  useEffect(() => {
    setCaptionValue(item?.caption || "");
  }, [item?.caption]);

  const showImage = Boolean(item && signedUrl);
  const showFailed = Boolean(item && !signedUrl && imageLoadFailed);
  const showResolving = Boolean(
    item && !signedUrl && !imageLoadFailed && imageResolving,
  );
  const showEmptySlot = Boolean(
    !item || (!signedUrl && !imageLoadFailed && !imageResolving),
  );

  const handleSaveCaption = async () => {
    if (!item) return;
    try {
      await onUpdateCaption(item.id, captionValue);
      setEditingCaption(false);
    } catch {
      setCaptionValue(item.caption || "");
    }
  };

  const slotDim = slotSize ?? CARD_SIZE;
  const isCompactSlot = slotSize != null;

  return (
    <View style={[styles.slotContainer, { width: slotDim, height: slotDim }]}>
      <GlassCard intensity={12} style={styles.slotCard}>
        <View style={styles.flex1}>
          {showImage && item ? (
            <View style={StyleSheet.absoluteFill}>
              <Image
                source={{ uri: signedUrl! }}
                style={StyleSheet.absoluteFill}
                contentFit={imageContentFit}
              />

              {/* Controls Overlay (Top) */}
              <View style={styles.topControls}>
                <TouchableOpacity
                  onPress={() => setEditingCaption(!editingCaption)}
                  disabled={working || uploading}
                  style={[
                    styles.controlBtn,
                    editingCaption && styles.controlBtnActive,
                  ]}
                >
                  <MessageSquare size={14} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onClear(item.id)}
                  disabled={working || uploading}
                  style={[styles.controlBtn, styles.clearBtn]}
                >
                  {working ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <X size={14} color="white" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Change photo: optional overlay; vault can use inline replace instead. */}
              {!editingCaption && !hideChangeOverlay && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.actionOverlay}
                  onPress={onUpload}
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
                        <Camera size={14} color={Theme.colors.text.secondary} />
                        <Text style={styles.actionText}>Change Photo</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              )}

              {/* Caption Overlay (Bottom) */}
              {!editingCaption && item.caption && (
                <View
                  style={[
                    styles.captionContainer,
                    hideChangeOverlay && styles.captionContainerCompact,
                  ]}
                >
                  <Text style={styles.captionText} numberOfLines={2}>
                    {item.caption}
                  </Text>
                </View>
              )}
            </View>
          ) : showFailed ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onUpload}
              disabled={uploading}
              style={styles.placeholder}
            >
              <View style={styles.placeholderContent}>
                <Text style={styles.failedTitle}>Could not load photo</Text>
                <Text style={styles.failedHint}>
                  Tap to try again or replace this slot.
                </Text>
              </View>
            </TouchableOpacity>
          ) : showResolving ? (
            <View style={styles.placeholder}>
              <View style={styles.placeholderContent}>
                <ActivityIndicator
                  size="large"
                  color={Theme.colors.brand.primary}
                />
                <Text style={styles.resolvingCaption}>Loading photo…</Text>
              </View>
            </View>
          ) : showEmptySlot ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onUpload}
              disabled={uploading}
              style={styles.placeholder}
            >
              <View
                style={[
                  styles.placeholderContent,
                  isCompactSlot && styles.placeholderContentCompact,
                ]}
              >
                <View
                  style={[
                    styles.logoWrapper,
                    isCompactSlot && styles.logoWrapperCompact,
                  ]}
                >
                  {uploading ? (
                    <ActivityIndicator color={Theme.colors.brand.primary} />
                  ) : (
                    <Logo size={isCompactSlot ? 32 : 48} />
                  )}
                </View>

                {!uploading && (
                  <View
                    style={[
                      styles.centeredActionBtn,
                      isCompactSlot && styles.centeredActionBtnCompact,
                    ]}
                  >
                    <Camera size={isCompactSlot ? 14 : 16} color="white" />
                    <Text
                      style={[
                        styles.centeredActionText,
                        isCompactSlot && styles.centeredActionTextCompact,
                      ]}
                    >
                      Capture Photo
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : null}

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
                  disabled={working}
                  style={styles.saveBtn}
                >
                  {working ? (
                    <ActivityIndicator
                      size="small"
                      color={Theme.colors.brand.primary}
                    />
                  ) : (
                    <Check size={18} color={Theme.colors.brand.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </GlassCard>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SIZE = SCREEN_WIDTH - 32;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    justifyContent: "center",
  },
  slotContainer: {
    alignSelf: "center",
  },
  slotCard: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  placeholderContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 20,
  },
  placeholderContentCompact: {
    gap: 8,
    padding: 10,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  logoWrapperCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  centeredActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Theme.colors.brand.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  centeredActionBtnCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
    marginTop: 4,
    borderRadius: 10,
  },
  centeredActionText: {
    color: "white",
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
  },
  centeredActionTextCompact: {
    fontSize: 10,
  },
  resolvingCaption: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
  },
  failedTitle: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    textAlign: "center",
  },
  failedHint: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  topControls: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 20,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  controlBtnActive: {
    backgroundColor: Theme.colors.brand.primary,
    borderColor: Theme.colors.brand.primary,
  },
  clearBtn: {
    backgroundColor: "rgba(220,38,38,0.6)",
  },
  captionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 70,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  captionContainerCompact: {
    paddingBottom: 14,
  },
  captionText: {
    color: "white",
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    lineHeight: 14,
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
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: Theme.colors.brand.primary,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  actionText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
});
