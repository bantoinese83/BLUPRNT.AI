import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Upload,
  CheckCircle2,
  History,
  ArrowUpRight,
  PlusCircle,
  LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { formatRelativeTime } from "../lib/activity";

export type ActivityEvent = {
  id: string;
  type: "upload" | "status_change" | "project_created" | "goal_reached";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
};

interface Props {
  events: ActivityEvent[];
}

const ICON_MAP: Record<ActivityEvent["type"], LucideIcon> = {
  upload: Upload,
  status_change: History,
  project_created: PlusCircle,
  goal_reached: CheckCircle2,
};

const COLOR_MAP: Record<
  ActivityEvent["type"],
  { text: string; bg: string; border: string }
> = {
  upload: {
    text: "#60a5fa",
    bg: "rgba(96, 165, 250, 0.1)",
    border: "rgba(96, 165, 250, 0.2)",
  },
  status_change: {
    text: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.1)",
    border: "rgba(251, 191, 36, 0.2)",
  },
  project_created: {
    text: "#34d399",
    bg: "rgba(52, 211, 153, 0.1)",
    border: "rgba(52, 211, 153, 0.2)",
  },
  goal_reached: {
    text: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.1)",
    border: "rgba(167, 139, 250, 0.2)",
  },
};

export function ActivityFeed({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Latest Activity</Text>
        <View style={styles.headerLine} />
      </View>

      <View style={styles.feedContainer}>
        {/* Vertical Line */}
        <View style={styles.timeline} />

        {events.map((event, idx) => {
          const Icon = ICON_MAP[event.type];
          const colors = COLOR_MAP[event.type];

          return (
            <MotiView
              key={event.id}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: idx * 100 }}
              style={styles.eventRow}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <Icon size={20} color={colors.text} />
              </View>

              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {formatRelativeTime(event.timestamp)}
                  </Text>
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>

                {event.link && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(event.link as any);
                    }}
                  >
                    <Text style={styles.linkText}>View Details</Text>
                    <ArrowUpRight
                      size={12}
                      color="#94a3b8"
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: 12,
  },
  feedContainer: {
    position: "relative",
    paddingLeft: 4,
  },
  timeline: {
    position: "absolute",
    left: 21,
    top: 4,
    bottom: 4,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  eventRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  eventContent: {
    flex: 1,
    paddingTop: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  eventTime: {
    fontSize: 10,
    fontFamily: "Outfit_600SemiBold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  eventDescription: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  linkText: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
