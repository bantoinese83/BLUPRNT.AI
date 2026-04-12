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
import { router, Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { formatRelativeTime, type ActivityEvent } from "@/lib/activity";
import { Theme } from "@/constants/Theme";
import { LinearGradient } from "expo-linear-gradient";

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

const COLOR_MAP: Record<
  ActivityEvent["type"],
  { text: string; bg: string; border: string }
> = {
  upload: {
    text: "#60a5fa",
    bg: "rgba(96, 165, 250, 0.08)",
    border: "rgba(96, 165, 250, 0.12)",
  },
  status_change: {
    text: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.08)",
    border: "rgba(251, 191, 36, 0.12)",
  },
  project_created: {
    text: "#34d399",
    bg: "rgba(52, 211, 153, 0.08)",
    border: "rgba(52, 211, 153, 0.12)",
  },
  goal_reached: {
    text: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.08)",
    border: "rgba(167, 139, 250, 0.12)",
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
        <View style={styles.timelineContainer}>
          <LinearGradient
            colors={[Theme.colors.divider, "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </View>

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
  timelineContainer: {
    position: "absolute",
    left: 21,
    top: 4,
    bottom: 4,
    width: 1.5,
    overflow: "hidden",
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
  eventTitleWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
