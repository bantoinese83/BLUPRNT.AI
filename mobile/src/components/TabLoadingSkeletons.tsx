import React from "react";
import { StyleSheet, View } from "react-native";
import { ScreenWrapper } from "./ScreenWrapper";
import { SkeletonLoader } from "./ui/SkeletonLoader";

/** Matches projects tab header + list cards while data loads */
export function ProjectsTabSkeleton() {
  return (
    <ScreenWrapper withLogo style={styles.flex}>
      <View style={styles.header}>
        <SkeletonLoader width={200} height={32} borderRadius={10} />
        <View style={{ height: 8 }} />
        <SkeletonLoader width={260} height={14} borderRadius={6} />
      </View>
      <View style={styles.list}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.cardGap}>
            <SkeletonLoader height={88} borderRadius={16} />
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

/** Matches finance header + stat row + invoice rows */
export function FinanceTabSkeleton() {
  return (
    <ScreenWrapper style={styles.flex}>
      <View style={styles.financePad}>
        <View style={styles.financeHeader}>
          <SkeletonLoader width={140} height={22} borderRadius={8} />
          <SkeletonLoader width={44} height={44} borderRadius={14} />
        </View>
        <SkeletonLoader height={120} borderRadius={20} />
        <View style={{ height: 20 }} />
        <SkeletonLoader width={100} height={12} borderRadius={6} />
        <View style={{ height: 12 }} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <SkeletonLoader height={72} borderRadius={14} />
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  list: {
    padding: 24,
    paddingTop: 0,
  },
  cardGap: {
    marginBottom: 16,
  },
  financePad: {
    flex: 1,
    padding: 24,
    width: "100%",
  },
  financeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
});
