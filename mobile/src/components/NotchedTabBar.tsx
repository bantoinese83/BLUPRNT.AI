import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { Theme } from "@/constants/Theme";

import assetManagementSvg from "@assets/asset-management.svg";
import assistantSvg from "@assets/assistant.svg";
import mansionSvg from "@assets/mansion.svg";
import userSvg from "@assets/user.svg";
import fileSvg from "@assets/file.svg";

const CORNER = 22;
/** Visible white bar height (icons sit here). */
const BAR_BODY = 56;
/** Half-width of center “bite” — matches FAB overlap. */
const NOTCH_HALF = 44;
/** Depth of notch into the bar (quadratic control). */
const NOTCH_DEPTH = 20;

type RouteName = "index" | "finance" | "new" | "ai" | "profile";

type TabIconRoute = Exclude<RouteName, "new">;

const TAB_ASSETS: Record<TabIconRoute, number> = {
  index: mansionSvg,
  finance: assetManagementSvg,
  ai: assistantSvg,
  profile: userSvg,
};

/**
 * Rounded top bar with smooth center U-notch for the Add FAB (cut-out look).
 */
function tabBarSurfacePath(w: number, bodyH: number): string {
  const cx = w / 2;
  const r = CORNER;
  const nh = NOTCH_HALF;
  return [
    `M 0 ${bodyH}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0`,
    `L ${cx - nh} 0`,
    `Q ${cx} ${NOTCH_DEPTH} ${cx + nh} 0`,
    `L ${w - r} 0`,
    `Q ${w} 0 ${w} ${r}`,
    `L ${w} ${bodyH}`,
    `Z`,
  ].join(" ");
}

export function NotchedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const barW = windowWidth;

  const routes = state.routes.filter((r) => r.name !== "projects");
  const leftRoutes = routes.filter(
    (r) => r.name === "index" || r.name === "finance",
  );
  const rightRoutes = routes.filter(
    (r) => r.name === "ai" || r.name === "profile",
  );
  const newRoute = routes.find((r) => r.name === "new");
  const newFocused =
    !!newRoute && state.routes[state.index]?.key === newRoute.key;

  const pressTab = (
    routeKey: string,
    routeName: string,
    isFocused: boolean,
  ) => {
    const event = navigation.emit({
      type: "tabPress",
      target: routeKey,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented && !isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(routeName as never);
    }
  };

  const pressFab = () => {
    if (!newRoute) return;
    const isFocused = state.routes[state.index]?.key === newRoute.key;
    const event = navigation.emit({
      type: "tabPress",
      target: newRoute.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      if (!isFocused) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate("new");
      }
    }
  };

  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: bottomPad,
          backgroundColor: Theme.colors.header,
        },
      ]}
    >
      <View style={styles.barStack} pointerEvents="box-none">
        <Svg width={barW} height={BAR_BODY} style={styles.svg}>
          <Path
            d={tabBarSurfacePath(barW, BAR_BODY)}
            fill={Theme.colors.header}
            stroke={Theme.colors.border}
            strokeWidth={StyleSheet.hairlineWidth}
          />
        </Svg>

        <View style={[styles.row, { width: barW, height: BAR_BODY }]}>
          <View style={styles.side}>
            {leftRoutes.map((route) => {
              const { options } = descriptors[route.key];
              const label = (options.title as string) || route.name;
              const focused = state.routes[state.index]?.key === route.key;
              const color = focused
                ? Theme.colors.brand.primary
                : Theme.colors.text.muted;
              const asset = TAB_ASSETS[route.name as TabIconRoute];
              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                  style={styles.tabBtn}
                  onPress={() => pressTab(route.key, route.name, focused)}
                  activeOpacity={0.75}
                >
                  {asset != null ? (
                    <Image
                      source={asset}
                      style={[styles.tabIcon, { opacity: focused ? 1 : 0.48 }]}
                      contentFit="contain"
                      accessibilityIgnoresInvertColors
                    />
                  ) : null}
                  <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.fabGap} />

          <View style={styles.side}>
            {rightRoutes.map((route) => {
              const { options } = descriptors[route.key];
              const label = (options.title as string) || route.name;
              const focused = state.routes[state.index]?.key === route.key;
              const color = focused
                ? Theme.colors.brand.primary
                : Theme.colors.text.muted;
              const asset = TAB_ASSETS[route.name as TabIconRoute];
              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                  style={styles.tabBtn}
                  onPress={() => pressTab(route.key, route.name, focused)}
                  activeOpacity={0.75}
                >
                  {asset != null ? (
                    <Image
                      source={asset}
                      style={[styles.tabIcon, { opacity: focused ? 1 : 0.48 }]}
                      contentFit="contain"
                      accessibilityIgnoresInvertColors
                    />
                  ) : null}
                  <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[styles.fabRing, { width: barW }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={pressFab}
            accessibilityRole="button"
            accessibilityLabel="Add project"
            accessibilityState={{ selected: newFocused }}
            style={styles.fabTouchable}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Theme.colors.brand.primary, Theme.colors.brand.deep]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.fabGradient}
            >
              <Image
                source={fileSvg}
                style={styles.fabIcon}
                contentFit="contain"
                tintColor="#ffffff"
                accessibilityIgnoresInvertColors
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignSelf: "stretch",
    overflow: "visible",
  },
  barStack: {
    width: "100%",
    alignItems: "stretch",
    overflow: "visible",
    ...Platform.select({
      ios: {
        shadowColor: "#042f2e",
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  svg: {},
  row: {
    position: "absolute",
    left: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  side: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 8,
  },
  fabGap: {
    width: NOTCH_HALF * 2 + 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minWidth: 52,
    paddingVertical: 4,
  },
  tabIcon: {
    width: 26,
    height: 26,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    letterSpacing: 0.15,
  },
  fabRing: {
    position: "absolute",
    top: -30,
    alignItems: "center",
    justifyContent: "flex-start",
    height: 72,
    pointerEvents: "box-none",
  },
  fabTouchable: {
    shadowColor: "#134e4a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 16,
    borderRadius: 34,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.98)",
  },
  fabIcon: {
    width: 30,
    height: 30,
  },
});
