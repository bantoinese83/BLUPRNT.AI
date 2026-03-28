import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Hammer, PlusCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";
import { GlassCard } from "./ui/GlassCard";
import type { ProjectRow } from "../types/database";

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
  // Always show switcher if there is at least 1 project, so we can see the "Add" button
  if (projects.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Switch Project</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: 24 },
        ]}
      >
        {projects.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.cardWrapper}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(p.id);
            }}
            onLongPress={() => {
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
                      const { error } = await supabase
                        .from("projects")
                        .delete()
                        .eq("id", p.id);
                      if (error) {
                        Alert.alert("Error", "Could not delete project.");
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
              intensity={8}
              style={[styles.card, p.id === currentId && styles.activeCard]}
            >
              <View style={styles.iconContainer}>
                <Hammer
                  size={12}
                  color={p.id === currentId ? "white" : "#4f46e5"}
                />
              </View>
              <Text
                style={[styles.name, p.id === currentId && styles.activeName]}
                numberOfLines={1}
              >
                {p.name}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* Create New Trigger */}
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAdd();
          }}
        >
          <GlassCard intensity={12} style={[styles.card, styles.addCard]}>
            <View style={[styles.iconContainer, styles.addIconContainer]}>
              <PlusCircle size={14} color="white" />
            </View>
            <Text style={styles.addText}>New Project</Text>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: "Outfit_800ExtraBold",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  cardWrapper: {
    width: 160,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeCard: {
    backgroundColor: "rgba(79, 70, 229, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  activeName: {
    color: "white",
  },
  addCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  addIconContainer: {
    backgroundColor: "#4f46e5",
  },
  addText: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "#94a3b8",
  },
});
