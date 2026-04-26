import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { MapPin } from "lucide-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { SnurraLoader } from "@/components/ui/SnurraLoader";
import { Theme } from "@/constants/Theme";
import type { OnboardingStyles } from "@/features/onboarding/onboarding-step-types";

interface LocationSelectorProps {
  styles: OnboardingStyles;
  location: string;
  setLocation: (loc: string) => void;
  locatingZip: boolean;
  onFillZipFromLocation: () => void;
}

export function LocationSelector({
  styles,
  location,
  setLocation,
  locatingZip,
  onFillZipFromLocation,
}: LocationSelectorProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      key="step1"
    >
      <Text style={styles.stepTitle}>Add your project location</Text>
      <Text style={styles.stepSubtitle}>
        We use your area to ground costs in real numbers, not guesses.
      </Text>
      <GlassCard intensity={20} style={styles.inputCard}>
        <View style={styles.zipInputRow}>
          <TextInput
            style={styles.zipTextInput}
            placeholder="Enter ZIP code"
            placeholderTextColor={Theme.colors.text.muted}
            value={location}
            onChangeText={setLocation}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={5}
            editable={!locatingZip}
            accessibilityLabel="ZIP code"
          />
          <TouchableOpacity
            style={[
              styles.zipLocateButton,
              locatingZip && styles.zipLocateButtonDisabled,
            ]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void onFillZipFromLocation();
            }}
            disabled={locatingZip}
            accessibilityRole="button"
            accessibilityLabel="Use current location to fill ZIP code"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {locatingZip ? (
              <SnurraLoader size={22} />
            ) : (
              <MapPin
                size={22}
                color={Theme.colors.brand.primary}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>
        </View>
      </GlassCard>
      <Text style={styles.zipLocateHint}>
        Tap the pin to use this device’s location once for your ZIP.
      </Text>
    </MotiView>
  );
}
