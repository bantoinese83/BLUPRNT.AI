import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { MoveHorizontal, Lock, UploadCloud } from "lucide-react-native";
import { Logo } from "@/components/ui/Logo";
import { Theme } from "@/constants/Theme";
import { supabase } from "@/lib/supabase";

type TransformationSliderProps = {
  projectId: string;
  beforePath: string | null;
  afterPath: string | null;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
  onRefresh?: () => void;
};

export function TransformationSlider({
  projectId,
  beforePath,
  afterPath,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
  onRefresh,
}: TransformationSliderProps) {
  const [width, setWidth] = useState(0);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const sliderPos = useState(new Animated.Value(0.5))[0];
  const isUnlocked = isArchitect || hasProjectPass;

  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [beforeError, setBeforeError] = useState(false);
  const [afterError, setAfterError] = useState(false);

  React.useEffect(() => {
    const fetchSignedUrls = async () => {
      if (beforePath) {
        const { data } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(beforePath, 3600);
        setBeforeUrl(data?.signedUrl ?? null);
      } else {
        setBeforeUrl(null);
      }

      if (afterPath) {
        const { data } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(afterPath, 3600);
        setAfterUrl(data?.signedUrl ?? null);
      } else {
        setAfterUrl(null);
      }
    };
    fetchSignedUrls();
  }, [beforePath, afterPath, projectId]);

  const handlePickPhoto = async (type: "before" | "after") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "We need access to your photos to upload hero shots.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
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
      const path = `${projectId}/${session.user.id}/${type}_hero_${Date.now()}.${ext}`;

      const formData = new FormData();
      formData.append("file", {
        uri,
        name: `${type}_hero.${ext}`,
        type: `image/${ext === "png" ? "png" : "jpeg"}`,
      } as unknown as Blob);

      const { error: uploadErr } = await supabase.storage
        .from("project-documents")
        .upload(path, formData, { contentType: "image/jpeg" });

      if (uploadErr) throw uploadErr;

      const updateData =
        type === "before"
          ? { before_photo_storage_path: path }
          : { after_photo_storage_path: path };

      const { error: updateErr } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);

      if (updateErr) throw updateErr;

      if (type === "before") setBeforeError(false);
      if (type === "after") setAfterError(false);
      onRefresh?.();
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "Could not update hero photo.";
      Alert.alert("Upload Failed", msg);
    } finally {
      setUploading(null);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !!isUnlocked,
    onPanResponderMove: (_, gestureState) => {
      if (width === 0 || !isUnlocked) return;
      const newPos = Math.max(0, Math.min(gestureState.moveX / width, 1));
      sliderPos.setValue(newPos);
    },
  });

  const LogoPlaceholder = () => (
    <View style={styles.placeholderRoot}>
      <View style={[styles.placeholderIcon, { opacity: 0.2 }]}>
        <Logo size={32} />
      </View>
      <Text style={styles.placeholderText}>Waiting for capture</Text>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        {uploading === "before" ? (
          <ActivityIndicator color={Theme.colors.brand.primary} />
        ) : (
          <Logo size={32} />
        )}
      </View>
      <Text style={styles.emptyTitle}>Visual Transformation</Text>
      <Text style={styles.emptyText}>
        Add a starting photo to track your renovation’s progress.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => handlePickPhoto("before")}
        disabled={!!uploading}
      >
        <Text style={styles.emptyBtnText}>Upload Before Photo</Text>
      </TouchableOpacity>
    </View>
  );

  if (!beforeUrl && !afterUrl) {
    return <EmptyState />;
  }

  const finalAfterUrl = afterUrl || beforeUrl;
  const finalBeforeUrl = beforeUrl || afterUrl;
  const showAfterPlaceholder = !finalAfterUrl || afterError;
  const showBeforePlaceholder = !finalBeforeUrl || beforeError;

  // If both are showing placeholders, we only want the background one to be visible
  // to prevent "double-vision" logos and layout issues.
  const hideForegroundPlaceholder =
    showBeforePlaceholder && showAfterPlaceholder;

  const leftWidth = isUnlocked
    ? sliderPos.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      })
    : "100%";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TRANSFORMATION</Text>
        <View style={styles.legend}>
          <Text style={styles.legendBefore}>Before</Text>
          <Text style={styles.legendAfter}>Now</Text>
        </View>
      </View>

      <View
        style={styles.sliderRoot}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {showAfterPlaceholder ? (
          <LogoPlaceholder />
        ) : (
          <Image
            source={{ uri: finalAfterUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            onError={() => setAfterError(true)}
          />
        )}

        <Animated.View style={[styles.beforeContainer, { width: leftWidth }]}>
          {showBeforePlaceholder ? (
            !hideForegroundPlaceholder && (
              <View style={{ width, height: "100%" }}>
                <LogoPlaceholder />
              </View>
            )
          ) : (
            <Image
              source={{ uri: finalBeforeUrl }}
              style={[styles.beforeImage, { width }]}
              contentFit="cover"
              onError={() => setBeforeError(true)}
            />
          )}
        </Animated.View>

        {isUnlocked ? (
          <Animated.View style={[styles.handle, { left: leftWidth }]}>
            <View style={styles.handleCircle}>
              <MoveHorizontal size={14} color={Theme.colors.brand.primary} />
            </View>
          </Animated.View>
        ) : (
          <TouchableOpacity
            style={styles.lockedOverlay}
            onPress={() => onUpgradeClick?.()}
          >
            <View style={styles.lockedBadge}>
              <Lock size={14} color={Theme.colors.brand.primary} />
              <Text style={styles.lockedText}>Upgrade to compare</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Action Overlays */}
        <View style={styles.actionOverlay}>
          <TouchableOpacity
            onPress={() => handlePickPhoto("before")}
            style={styles.actionBtn}
            disabled={!!uploading}
          >
            {uploading === "before" ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <UploadCloud size={12} color="white" />
                <Text style={styles.actionBtnText}>Before</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePickPhoto("after")}
            style={styles.actionBtn}
            disabled={!!uploading}
          >
            {uploading === "after" ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <UploadCloud size={12} color="white" />
                <Text style={styles.actionBtnText}>After</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  legend: {
    flexDirection: "row",
    gap: 12,
  },
  legendBefore: {
    fontSize: 9,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.disabled,
    textTransform: "uppercase",
  },
  legendAfter: {
    fontSize: 9,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
  },
  sliderRoot: {
    height: 200,
    borderRadius: 24,
    backgroundColor: Theme.colors.card,
    overflow: "hidden",
  },
  beforeContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderRightWidth: 2,
    borderRightColor: "#fff",
  },
  beforeImage: {
    height: 200,
  },
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -1,
  },
  handleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  lockedText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  actionOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  actionBtnText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: "white",
    textTransform: "uppercase",
  },
  emptyContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Theme.colors.border,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.01)",
    marginTop: 16,
    padding: 24,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    textAlign: "center",
    marginBottom: 16,
    maxWidth: 200,
  },
  emptyBtn: {
    backgroundColor: Theme.colors.brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: "white",
  },
  placeholderRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.01)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  placeholderText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.disabled,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
