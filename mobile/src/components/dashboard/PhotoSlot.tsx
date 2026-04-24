import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import {
  Camera,
  X,
  MessageSquare,
  Check,
  Image as ImageIcon,
} from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { GlassCard } from "@/components/ui/GlassCard";

type GalleryItem = import("@shared/types/database").GalleryItemRow;

export type PhotoSlotProps = {
  label: string;
  icon: React.ReactNode;
  item: GalleryItem | null;
  signedUrl: string | null;
  uploading: boolean;
  onUpload: () => void;
  onClear: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
};

export function PhotoSlot({
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
        <View style={styles.flex1}>
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

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  slotContainer: {
    width: "100%",
    aspectRatio: 1,
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
    backgroundColor: Theme.colors.inputBg,
    gap: 8,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderLabel: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.disabled,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    paddingBottom: 70, // Leave room for badge + actions
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  captionText: {
    color: "white",
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    lineHeight: 14,
  },
  badgeContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "white",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
});
