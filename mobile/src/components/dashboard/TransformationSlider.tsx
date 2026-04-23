import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Camera, MoveHorizontal, Lock } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { supabase } from "@/lib/supabase";

type TransformationSliderProps = {
  beforePath: string | null;
  afterPath: string | null;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
};

export function TransformationSlider({
  beforePath,
  afterPath,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
}: TransformationSliderProps) {
  const [width, setWidth] = useState(0);
  const sliderPos = useState(new Animated.Value(0.5))[0];
  const isUnlocked = isArchitect || hasProjectPass;

  const getPublicUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from("project-photos").getPublicUrl(path).data
      .publicUrl;
  };

  const beforeUrl = getPublicUrl(beforePath);
  const afterUrl = getPublicUrl(afterPath);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !!isUnlocked,
    onPanResponderMove: (_, gestureState) => {
      if (width === 0 || !isUnlocked) return;
      const newPos = Math.max(0, Math.min(gestureState.moveX / width, 1));
      sliderPos.setValue(newPos);
    },
  });

  if (!beforeUrl) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Camera size={24} color={Theme.colors.text.disabled} />
        </View>
        <Text style={styles.emptyTitle}>Visual Transformation</Text>
        <Text style={styles.emptyText}>
          Add a starting photo to track your renovation’s progress.
        </Text>
      </View>
    );
  }

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

      <TouchableOpacity
        activeOpacity={isUnlocked ? 1 : 0.9}
        onPress={() => !isUnlocked && onUpgradeClick?.()}
        style={styles.sliderRoot}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <Image
          source={{ uri: afterUrl || beforeUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />

        <Animated.View style={[styles.beforeContainer, { width: leftWidth }]}>
          <Image
            source={{ uri: beforeUrl }}
            style={[styles.beforeImage, { width }]}
            contentFit="cover"
          />
        </Animated.View>

        {isUnlocked ? (
          <Animated.View style={[styles.handle, { left: leftWidth }]}>
            <View style={styles.handleCircle}>
              <MoveHorizontal size={14} color={Theme.colors.brand.primary} />
            </View>
          </Animated.View>
        ) : (
          <View style={styles.lockedOverlay}>
            <View style={styles.lockedBadge}>
              <Lock size={14} color={Theme.colors.brand.primary} />
              <Text style={styles.lockedText}>Upgrade to compare</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
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
  emptyContainer: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Theme.colors.border,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.01)",
    marginTop: 16,
    padding: 20,
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
  },
});
