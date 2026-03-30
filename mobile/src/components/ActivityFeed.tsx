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
import { Theme } from "../constants/Theme";

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
    text: Theme.colors.brand.primary,
    bg: "rgba(79, 70, 229, 0.08)",
    border: "rgba(79, 70, 229, 0.12)",
  },
  status_change: {
    text: Theme.colors.status.warning,
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.12)",
  },
  project_created: {
    text: Theme.colors.status.success,
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.12)",
  },
  goal_reached: {
    text: "#818cf8",
    bg: "rgba(129, 140, 248, 0.08)",
    border: "rgba(129, 140, 248, 0.12)",
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
                      router.push(
                        event.link as Parameters<typeof router.push>[0],
                      );
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
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.divider,
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
    backgroundColor: Theme.colors.divider,
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
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  eventTime: {
    fontSize: 10,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
  },
  eventDescription: {
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  linkText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
