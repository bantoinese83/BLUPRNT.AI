import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Theme } from "@/constants/Theme";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";

interface Props {
  onPress: () => Promise<void> | void;
  title: string;
  variant?: "primary" | "outline" | "ghost" | "destructive";
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  textSize?: number;
  /** Overrides visible title for screen readers when needed */
  accessibilityLabel?: string;
  /** Primary buttons default to uppercase; use `sentence` to match web-style labels (e.g. “Continue”). */
  titleCase?: "uppercase" | "sentence";
  testID?: string;
}

export function Button({
  onPress,
  title,
  variant = "primary",
  loading = false,
  icon,
  style,
  disabled = false,
  textSize,
  accessibilityLabel,
  titleCase = "uppercase",
  testID,
}: Props) {
  const a11yLabel = accessibilityLabel ?? title;
  const primaryTextStyle =
    titleCase === "sentence" ? styles.textPrimarySentence : styles.text;
  const isInteractionDisabled = loading || disabled;

  const handlePress = () => {
    if (isInteractionDisabled) return;

    // Use medium haptic for the primary action to feel "heavier" and more purposeful
    if (variant === "primary") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  };

  if (variant === "primary" || variant === "destructive") {
    const gradientColors: [string, string, ...string[]] =
      variant === "destructive"
        ? [Theme.colors.status.error, "#b91c1c"]
        : [Theme.colors.cta.from, Theme.colors.cta.to];
    const shadowColor =
      variant === "destructive"
        ? Theme.colors.status.error
        : Theme.colors.cta.from;

    const outerLayout = style
      ? {
          flex: style.flex,
          width: style.width,
          alignSelf: style.alignSelf,
          minWidth: style.minWidth,
          maxWidth: style.maxWidth,
          flexGrow: style.flexGrow,
          flexShrink: style.flexShrink,
        }
      : undefined;

    return (
      <View style={[styles.shadowContainer, { shadowColor }, outerLayout]}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={isInteractionDisabled}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityState={{ disabled: isInteractionDisabled }}
          testID={testID}
          style={style?.width === "100%" ? { width: "100%" } : undefined}
        >
          <MotiView
            animate={{
              scale: isInteractionDisabled ? 0.98 : 1,
              opacity: isInteractionDisabled ? 0.6 : 1,
            }}
            transition={{ type: "timing", duration: 150 }}
            style={[styles.button, style]}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
              {loading ? (
                <SnurraLoader size={SnurraSize.inline} tone="onPrimary" />
              ) : (
                <>
                  <Text
                    style={[
                      primaryTextStyle,
                      textSize ? { fontSize: textSize } : {},
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {title}
                  </Text>
                  {icon && (
                    <View
                      style={[
                        styles.icon,
                        title ? { marginLeft: Theme.spacing.xs } : {},
                      ]}
                    >
                      {icon}
                    </View>
                  )}
                </>
              )}
            </View>
          </MotiView>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isInteractionDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled: isInteractionDisabled }}
      testID={testID}
      style={[
        styles.button,
        variant === "outline" ? styles.outline : styles.ghost,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <SnurraLoader size={SnurraSize.inline} tone="brand" />
        ) : (
          <>
            <Text
              style={[
                styles.text,
                variant === "outline"
                  ? styles.textOutline
                  : variant === "ghost"
                    ? styles.textGhost
                    : {},
                titleCase === "sentence" && styles.titleSentenceMixin,
                isInteractionDisabled ? { opacity: 0.5 } : {},
                textSize ? { fontSize: textSize } : {},
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {title}
            </Text>
            {icon && (
              <View
                style={[
                  styles.icon,
                  title ? { marginLeft: Theme.spacing.xs } : {},
                ]}
              >
                {icon}
              </View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: Theme.colors.cta.from,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    height: 56,
    borderRadius: Theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: Theme.spacing.padding,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: "rgba(15, 23, 42, 0.2)",
    backgroundColor: "rgba(15, 23, 42, 0.04)",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.black,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  textPrimarySentence: {
    color: "white",
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.bold,
    letterSpacing: 0.2,
    textTransform: "none",
  },
  /** Outline/ghost: strip uppercase while keeping their color + weight from textOutline/textGhost */
  titleSentenceMixin: {
    textTransform: "none",
    letterSpacing: 0.2,
  },
  /** Secondary control — visible but subservient to primary CTA */
  textOutline: {
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.semibold,
  },
  /** Lowest priority — steps back (muted, lighter weight) */
  textGhost: {
    color: Theme.colors.text.muted,
    fontFamily: Theme.typography.family.medium,
  },
  icon: {
    // No margin if there's no text to separate from
  },
});
