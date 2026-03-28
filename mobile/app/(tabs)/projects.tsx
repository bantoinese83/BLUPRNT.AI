import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Folder, ArrowRight } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";

export default function ProjectsScreen() {
  const { projects, loading, load } = useDashboardData();

  return (
    <ScreenWrapper withLogo withScroll onRefresh={load} refreshing={loading}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Projects</Text>
        <Text style={styles.subtitle}>All home renovation estimates</Text>
      </View>

      <View style={styles.scrollContent}>
        {projects.map((p, idx) => (
          <MotiView
            key={p.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: idx * 50 }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/project/${p.id}`);
              }}
            >
              <GlassCard style={styles.projectCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Folder size={20} color="#4f46e5" />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.projectName}>{p.name}</Text>
                    <Text style={styles.projectMeta}>
                      {p.stage || "Planning"}
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#64748b" />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 24,
  },
  projectCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: "white",
    letterSpacing: -0.2,
  },
  projectMeta: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    color: "#64748b",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
