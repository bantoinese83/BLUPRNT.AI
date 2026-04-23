import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  History,
  Zap,
  X,
  Image as ImageIcon,
} from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "@/components/ui/GlassCard";

type TransformationVaultProps = {
  projectId: string;
  beforePath: string | null;
  afterPath: string | null;
  onRefresh?: () => void;
};

type PhotoSlotProps = {
  label: string;
  icon: React.ReactNode;
  path: string | null;
  url: string | null;
  uploading: boolean;
  onUpload: () => void;
  onClear: () => void;
  error: boolean;
};

function PhotoSlot({
  label,
  icon,
  path,
  url,
  uploading,
  onUpload,
  onClear,
  error,
}: PhotoSlotProps) {
  const showPlaceholder = !url || error || !path;

  return (
    <View style={styles.slotContainer}>
      <GlassCard intensity={8} style={styles.slotCard}>
        <View style={{ height: "100%" }}>
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
                source={{ uri: url! }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              {/* Clear Button */}
              <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                <X size={14} color="white" />
              </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.actionOverlay}
            onPress={onUpload}
            disabled={uploading}
          >
            <View style={styles.actionBtn}>
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Camera size={16} color="white" />
                  <Text style={styles.actionText}>
                    {showPlaceholder ? `Capture` : `Change`}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

export function TransformationVault({
  projectId,
  beforePath,
  afterPath,
  onRefresh,
}: TransformationVaultProps) {
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [beforeError, setBeforeError] = useState(false);
  const [afterError, setAfterError] = useState(false);

  const failedPathsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const fetchSignedUrls = async () => {
      // 1. Before Path
      if (beforePath && !failedPathsRef.current.has(beforePath)) {
        const { data, error } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(beforePath, 3600);
        if (active) {
          if (error) {
            setBeforeError(true);
            failedPathsRef.current.add(beforePath);
          } else {
            setBeforeUrl(data?.signedUrl ?? null);
            setBeforeError(false);
          }
        }
      } else if (active) {
        setBeforeUrl(null);
        setBeforeError(false);
      }

      // 2. After Path
      if (afterPath && !failedPathsRef.current.has(afterPath)) {
        const { data, error } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(afterPath, 3600);
        if (active) {
          if (error) {
            setAfterError(true);
            failedPathsRef.current.add(afterPath);
          } else {
            setAfterUrl(data?.signedUrl ?? null);
            setAfterError(false);
          }
        }
      } else if (active) {
        setAfterUrl(null);
        setAfterError(false);
      }
    };
    void fetchSignedUrls();
    return () => {
      active = false;
    };
  }, [beforePath, afterPath]);

  const handlePickPhoto = async (type: "before" | "after") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Allow photo access to curate your transformation vault.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      void runUpload(result.assets[0].uri, type);
    }
  };

  const runUpload = async (uri: string, type: "before" | "after") => {
    setUploading(type);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Unauthorized");

      const ext = uri.split(".").pop() || "jpg";
      const path = `${projectId}/${session.user.id}/vault_${type}_${Date.now()}.${ext}`;

      const formData = new FormData();
      formData.append("file", {
        uri,
        name: `vault_${type}.${ext}`,
        type: `image/${ext === "png" ? "png" : "jpeg"}`,
      } as unknown as Blob);

      const { error: upErr } = await supabase.storage
        .from("project-documents")
        .upload(path, formData, { contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const updateData =
        type === "before"
          ? { before_photo_storage_path: path }
          : { after_photo_storage_path: path };

      const { error: dbErr } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);
      if (dbErr) throw dbErr;

      failedPathsRef.current.delete(path);

      if (type === "before") setBeforeError(false);
      if (type === "after") setAfterError(false);
      onRefresh?.();
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "Failed to update vault photo";
      Alert.alert("Error", msg);
    } finally {
      setUploading(null);
    }
  };

  const handleClear = async (type: "before" | "after") => {
    try {
      const updateData =
        type === "before"
          ? { before_photo_storage_path: null }
          : { after_photo_storage_path: null };

      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);
      if (error) throw error;

      if (type === "before") setBeforeUrl(null);
      else setAfterUrl(null);

      onRefresh?.();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not remove photo");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TRANSFORMATION VAULT</Text>
        <Zap
          size={12}
          color={Theme.colors.brand.primary}
          fill={Theme.colors.brand.primary}
        />
      </View>

      <View style={styles.grid}>
        <PhotoSlot
          label="Baseline"
          icon={<History size={10} color="white" />}
          path={beforePath}
          url={beforeUrl}
          uploading={uploading === "before"}
          onUpload={() => handlePickPhoto("before")}
          onClear={() => handleClear("before")}
          error={beforeError}
        />
        <PhotoSlot
          label="Current"
          icon={
            <Zap
              size={10}
              color={Theme.colors.brand.primary}
              fill={Theme.colors.brand.primary}
            />
          }
          path={afterPath}
          url={afterUrl}
          uploading={uploading === "after"}
          onUpload={() => handlePickPhoto("after")}
          onClear={() => handleClear("after")}
          error={afterError}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 2,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
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
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 12,
  },
  placeholderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  placeholderLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
  },
  badgeContainer: {
    position: "absolute",
    top: 10,
    left: 10,
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
    bottom: 10,
    left: 10,
    right: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  clearBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
