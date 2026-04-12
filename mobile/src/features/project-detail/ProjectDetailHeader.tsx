import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft, Share2, Plus } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";

type Props = {
  title: string | undefined;
  onShare: () => void;
  onAddPress: () => void;
};

export function ProjectDetailHeader({ title, onShare, onAddPress }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          router.back();
        }}
        style={styles.backButton}
      >
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        <ChevronLeft size={24} color={Theme.colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.actionIcon}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onShare();
          }}
        >
          <BlurView
            intensity={10}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <Share2 size={20} color={Theme.colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionIcon,
            { backgroundColor: Theme.colors.brand.primary },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddPress();
          }}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
