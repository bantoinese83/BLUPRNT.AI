import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";
import { profileTabStyles as styles } from "@/features/profile-tab/profile-tab.styles";

type ProfileSettingItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export function ProfileSettingItem({
  icon,
  title,
  subtitle,
  onPress,
}: ProfileSettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={Theme.colors.text.primary} />
    </TouchableOpacity>
  );
}
