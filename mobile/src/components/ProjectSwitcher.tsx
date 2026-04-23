import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { PlusCircle } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import type { ProjectRow } from "@/types/database";
import { ProjectIcon } from "@/lib/project-icons";

type ProjectSwitcherProps = {
  projects: ProjectRow[];
  currentId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

export function ProjectSwitcher({
  projects,
  currentId,
  onSelect,
  onAdd,
}: ProjectSwitcherProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Always show switcher if there is at least 1 project, so we can see the "Add" button
  if (projects.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Switch Project</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: 24, paddingRight: 112 },
        ]}
        data={projects}
        keyExtractor={(p) => p.id}
        renderItem={({ item: p }) => (
          <TouchableOpacity
            testID={`project-card-${p.name}`}
            style={styles.cardWrapper}
            disabled={deletingId === p.id}
            onPress={() => {
              if (deletingId === p.id) return;
              Haptics.selectionAsync();
              onSelect(p.id);
            }}
            onLongPress={() => {
              if (deletingId) return;
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
              Alert.alert(
                "Delete Project",
                `Are you sure you want to delete "${p.name}"? This will remove all associated invoices and scope items.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      setDeletingId(p.id);
                      const { error } = await supabase
                        .from("projects")
                        .delete()
                        .eq("id", p.id);
                      setDeletingId(null);
                      if (error) {
                        Alert.alert(
                          "Couldn't delete project",
                          "Please check your connection and try again.",
                        );
                      } else {
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success,
                        );
                        Alert.alert("Deleted", "Project has been removed.");
                      }
                    },
                  },
                ],
              );
            }}
          >
            <GlassCard
              intensity={p.id === currentId ? 0 : 8}
              style={[styles.card, p.id === currentId && styles.activeCard]}
            >
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: p.id === currentId ? 1.1 : 1 }}
                transition={{
                  type: "spring",
                  damping: 10,
                  loop: p.id === currentId ? true : false,
                }}
                style={[
                  styles.iconContainer,
                  p.id === currentId && styles.activeIconContainer,
                ]}
              >
                <ProjectIcon name={p.name} size={14} />
              </MotiView>
              <View style={styles.textContainer}>
                <Text
                  style={[styles.name, p.id === currentId && styles.activeName]}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
                <Text
                  style={[
                    styles.metaText,
                    p.id === currentId && styles.activeMetaText,
                  ]}
                  numberOfLines={1}
                >
                  {p.created_at
                    ? new Date(p.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                  {p.estimated_min_total
                    ? ` • $${Math.round(p.estimated_min_total / 1000)}k`
                    : " • Planning"}
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addCardWrapper}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              onAdd();
            }}
          >
            <GlassCard intensity={12} style={[styles.card, styles.addCard]}>
              <View style={[styles.iconContainer, styles.addIconContainer]}>
                <PlusCircle size={18} color="white" />
              </View>
            </GlassCard>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 12,
  },
  label: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  scrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  cardWrapper: {
    width: 160,
  },
  addCardWrapper: {
    width: 80,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  activeCard: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    borderColor: "rgba(13, 148, 136, 0.2)",
  },
  addCard: {
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderStyle: "dashed",
    borderColor: Theme.colors.divider,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconContainer: {
    backgroundColor: "rgba(13, 148, 136, 0.15)",
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  activeName: {
    color: Theme.colors.brand.primary,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  metaText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  activeMetaText: {
    color: "rgba(13, 148, 136, 0.6)",
  },
  addIconContainer: {
    backgroundColor: Theme.colors.brand.primary,
  },
  addText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
  },
});
