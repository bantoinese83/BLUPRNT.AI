import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { ScreenWrapper } from "@/components/ScreenWrapper";

export function DashboardSkeleton() {
  return (
    <ScreenWrapper withLogo withScroll style={styles.container}>
      <View style={styles.content}>
        {/* Header Skeleton */}
        <View style={styles.headerRow}>
          <View style={{ gap: 8 }}>
            <SkeletonLoader width={120} height={16} borderRadius={8} />
            <SkeletonLoader width={180} height={32} borderRadius={12} />
          </View>
          <View style={styles.headerBtns}>
            <SkeletonLoader width={44} height={44} borderRadius={14} />
            <SkeletonLoader width={44} height={44} borderRadius={14} />
          </View>
        </View>

        {/* Stats Row Skeleton */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContent}
        >
          <SkeletonLoader width={220} height={140} borderRadius={24} />
          <SkeletonLoader width={220} height={140} borderRadius={24} />
          <SkeletonLoader width={220} height={140} borderRadius={24} />
        </ScrollView>

        {/* Main Content Skeletons */}
        <View style={{ gap: 24 }}>
          <SkeletonLoader height={180} borderRadius={24} />
          <SkeletonLoader height={140} borderRadius={24} />

          <View style={{ gap: 16 }}>
            <SkeletonLoader width={150} height={12} borderRadius={6} />
            <SkeletonLoader height={160} borderRadius={24} />
          </View>

          <View style={{ gap: 16 }}>
            <SkeletonLoader width={150} height={12} borderRadius={6} />
            <View style={{ gap: 12 }}>
              <SkeletonLoader height={70} borderRadius={16} />
              <SkeletonLoader height={70} borderRadius={16} />
              <SkeletonLoader height={70} borderRadius={16} />
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  headerBtns: {
    flexDirection: "row",
    gap: 12,
  },
  statsScroll: {
    marginHorizontal: -24,
    marginBottom: 24,
  },
  statsContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
});
