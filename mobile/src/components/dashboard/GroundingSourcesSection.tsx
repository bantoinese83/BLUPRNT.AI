import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { ShieldCheck, ExternalLink } from "lucide-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import type { ProjectRow } from "@shared/types/database";

export function GroundingSourcesSection({ project }: { project: ProjectRow }) {
  const sources = project.grounding_sources || [];

  if (sources.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TRUST & GROUNDING</Text>
      </View>

      <GlassCard intensity={4} style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <ShieldCheck size={12} color="white" />
            <Text style={styles.badgeText}>Verified Sources</Text>
          </View>
        </View>

        <Text style={styles.description}>
          This estimate is anchored in real-world data points specifically for
          your area.
        </Text>

        <View style={styles.list}>
          {sources.map((src, idx) => (
            <View key={idx} style={styles.sourceRow}>
              <Text style={styles.sourceText} numberOfLines={1}>
                • {src.title}
              </Text>
              {src.url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(src.url!)}
                  style={styles.linkBtn}
                >
                  <ExternalLink size={12} color={Theme.colors.brand.primary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 2,
  },
  card: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(16, 185, 129, 0.03)",
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: "white",
    textTransform: "uppercase",
  },
  description: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: "#065f46",
    lineHeight: 18,
    marginBottom: 12,
  },
  list: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 185, 129, 0.1)",
    paddingTop: 12,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sourceText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
  },
  linkBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(13, 148, 136, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
});
