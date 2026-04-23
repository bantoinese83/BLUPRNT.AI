import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Upload,
  CheckCircle2,
  History,
  ArrowUpRight,
  PlusCircle,
  type LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import { router, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { formatRelativeTime, type ActivityEvent } from "@/lib/activity";
import { Theme } from "@/constants/Theme";

export type { ActivityEvent };

interface Props {
  events: ActivityEvent[];
}

const ICON_MAP: Record<ActivityEvent["type"], LucideIcon> = {
  upload: Upload,
  status_change: History,
  project_created: PlusCircle,
  goal_reached: CheckCircle2,
};

/** Solid fills so a timeline spine never shows through the icon tiles. */
const COLOR_MAP: Record<
  ActivityEvent["type"],
  { text: string; bg: string; border: string }
> = {
  upload: {
    text: "#2563eb",
    bg: "rgba(37, 99, 235, 0.08)",
    border: "rgba(37, 99, 235, 0.15)",
  },
  status_change: {
    text: "#b45309",
    bg: "rgba(180, 83, 9, 0.08)",
    border: "rgba(180, 83, 9, 0.15)",
  },
  project_created: {
    text: "#047857",
    bg: "rgba(4, 120, 87, 0.08)",
    border: "rgba(4, 120, 87, 0.15)",
  },
  goal_reached: {
    text: "#6d28d9",
    bg: "rgba(109, 40, 217, 0.08)",
    border: "rgba(109, 40, 217, 0.15)",
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
        {/* Spine sits in the gap between icons and copy — never through the tiles. */}
        <View style={styles.timelineSpine} pointerEvents="none" />

        {events.map((event, idx) => {
          const Icon = ICON_MAP[event.type];
          const colors = COLOR_MAP[event.type];
          const isLast = idx === events.length - 1;

          return (
            <MotiView
              key={event.id}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: idx * 100 }}
              style={[styles.eventRow, !isLast && styles.eventRowSpacing]}
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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (event.link) {
                      Haptics.selectionAsync();
                      router.push(event.link as Href);
                    }
                  }}
                  disabled={!event.link}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTitleWrapper}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {event.link && (
                        <ArrowUpRight
                          size={14}
                          color={Theme.colors.text.muted}
                        />
                      )}
                    </View>
                    <Text style={styles.eventTime}>
                      {formatRelativeTime(event.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.eventDescription}>
                    {event.description}
                  </Text>
                </TouchableOpacity>
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
    marginBottom: 12,
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
  /**
   * Icon column: paddingLeft 4 + width 44 → right edge 48. Gap to text is 16px.
   * Spine centered in that gap: starts ~52px, 2px wide.
   * Trim top/bottom so the stroke does not run past the first/last icon tiles.
   */
  timelineSpine: {
    position: "absolute",
    left: 51,
    top: 26,
    bottom: 26,
    width: 2,
    borderRadius: 2,
    backgroundColor: Theme.colors.divider,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  eventRowSpacing: {
    marginBottom: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
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
  eventTitleWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
