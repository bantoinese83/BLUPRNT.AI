import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { X, Upload, ListTree, FileDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView, AnimatePresence } from "moti";
import { Theme } from "@/constants/Theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { WelcomeActionOrb } from "@/components/WelcomeActionOrb";

interface Props {
  onAction: (id: string) => void;
}

export function DashboardWelcomeBanner({ onAction }: Props) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, scale: 0.95, translateY: -10 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          exit={{ opacity: 0, scale: 0.95, translateY: -10 }}
          transition={{ type: "timing", duration: 320 }}
          style={styles.container}
        >
          <GlassCard intensity={4} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>Your estimate is saved</Text>
                <Text style={styles.description}>
                  Pick a next step to get the most from BLUPRNT.AI.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.closeBtn}
              >
                <X size={18} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.actions}>
              <WelcomeActionOrb label="Upload invoice">
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Upload an invoice"
                  activeOpacity={0.88}
                  onPress={() => {
                    void Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Medium,
                    );
                    onAction("upload");
                  }}
                  style={[styles.circleBtn, styles.circlePrimary]}
                >
                  <Upload size={20} color="#ffffff" strokeWidth={2} />
                </TouchableOpacity>
              </WelcomeActionOrb>
              <WelcomeActionOrb label="View scope">
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="See line-by-line scope"
                  activeOpacity={0.88}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onAction("scope");
                  }}
                  style={[styles.circleBtn, styles.circleOutline]}
                >
                  <ListTree
                    size={20}
                    color={Theme.colors.brand.primary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </WelcomeActionOrb>
              <WelcomeActionOrb label="Export packet">
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Export seller packet"
                  activeOpacity={0.88}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onAction("export");
                  }}
                  style={[styles.circleBtn, styles.circleOutline]}
                >
                  <FileDown
                    size={20}
                    color={Theme.colors.brand.primary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </WelcomeActionOrb>
            </View>
          </GlassCard>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  description: {
    fontSize: 13,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 4,
    paddingHorizontal: 0,
    gap: 4,
  },
  /**
   * RN + iOS often fail to paint dotted/dashed borders on circles; fills can disappear.
   * Solid rings + elevation read clearly on GlassCard / blur.
   */
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "solid",
    ...Platform.select({
      ios: {
        shadowColor: "#042f2e",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  circlePrimary: {
    backgroundColor: Theme.colors.cta.from,
    borderColor: "rgba(255, 255, 255, 0.55)",
  },
  circleOutline: {
    backgroundColor: "#ffffff",
    borderColor: Theme.colors.brand.primary,
  },
});
