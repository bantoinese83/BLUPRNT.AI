import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { Plus, MessageCircle } from "lucide-react-native";
import { ConfidenceDisplay } from "@/components/ui/ConfidenceDisplay";
import { Theme } from "@/constants/Theme";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { homeTabStyles as styles } from "../home-tab.styles";

interface DashboardHeaderProps {
  greetingLine: string;
  dashboardSubline: string;
  confidenceScore: number | null | undefined;
  isUploading: boolean;

  isExporting: boolean;
  onRenamePress: () => void;
  onInsightsPress: () => void;
  onAddDocumentPress: () => void;
}

export function DashboardHeader({
  greetingLine,
  dashboardSubline,
  confidenceScore,
  isUploading,
  isExporting,
  onRenamePress,
  onInsightsPress,
  onAddDocumentPress,
}: DashboardHeaderProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 420 }}
      style={styles.headerContainer}
    >
      <View style={styles.headerTitleBlock}>
        <TouchableOpacity
          testID="rename-project-trigger"
          onPress={onRenamePress}
          accessibilityRole="button"
          accessibilityLabel="Rename project"
        >
          <Text
            style={styles.welcomeText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {greetingLine}
          </Text>
          <Text
            style={styles.userFirstName}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {dashboardSubline}
          </Text>
          <View style={{ marginTop: 4 }}>
            <ConfidenceDisplay score={confidenceScore ?? null} size={10} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={onInsightsPress}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Smart insights"
        >
          <MessageCircle size={22} color={Theme.colors.brand.primary} />
          <View
            style={[
              styles.insightsDot,
              { backgroundColor: Theme.colors.brand.primary },
            ]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAddDocumentPress}
          disabled={isUploading || isExporting}
          style={[styles.headerBtn, styles.captureBtn]}
          accessibilityRole="button"
          accessibilityLabel="Add document"
        >
          {isUploading || isExporting ? (
            <SnurraLoader size={SnurraSize.inline} tone="onPrimary" />
          ) : (
            <Plus size={22} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}
