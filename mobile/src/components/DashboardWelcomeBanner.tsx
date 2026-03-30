import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { X, Upload, ListTree, FileDown } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { Theme } from "../constants/Theme";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";

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
          transition={{ type: "timing", duration: 400 }}
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
              <Button
                title=""
                onPress={() => onAction("upload")}
                style={styles.actionBtn}
                icon={<Upload size={20} color="white" />}
                variant="primary"
              />
              <Button
                title=""
                onPress={() => onAction("scope")}
                style={styles.actionBtn}
                icon={<ListTree size={20} color={Theme.colors.brand.primary} />}
                variant="outline"
              />
              <Button
                title=""
                onPress={() => onAction("export")}
                style={styles.actionBtn}
                icon={<FileDown size={20} color={Theme.colors.brand.primary} />}
                variant="outline"
              />
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
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    paddingHorizontal: 4,
  },
});
