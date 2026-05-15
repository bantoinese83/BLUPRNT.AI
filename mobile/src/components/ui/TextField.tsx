import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  type ViewStyle,
  TouchableOpacity,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { Theme } from "@/constants/Theme";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  style?: ViewStyle;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  style,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry && !showPassword;

  const togglePassword = () => {
    Haptics.selectionAsync();
    setShowPassword(!showPassword);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, isFocused && styles.labelFocused]}>
        {label}
      </Text>
      <MotiView
        animate={{
          borderColor: error
            ? Theme.colors.status.error
            : isFocused
              ? Theme.colors.brand.primary
              : Theme.colors.border,
          backgroundColor: isFocused
            ? "rgba(13, 148, 136, 0.06)"
            : Theme.colors.inputBg,
        }}
        transition={{ type: "timing", duration: 200 }}
        style={[styles.inputContainer, error ? styles.inputError : {}]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.text.muted}
          secureTextEntry={isPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={error ? `${label}. ${error}` : placeholder}
          accessibilityRole="text"
          selectionColor={Theme.colors.brand.primary}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePassword}
            style={styles.toggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={
              showPassword ? "Hide password" : "Show password"
            }
            accessibilityRole="button"
          >
            {showPassword ? (
              <EyeOff size={20} color={Theme.colors.text.secondary} />
            ) : (
              <Eye size={20} color={Theme.colors.text.secondary} />
            )}
          </TouchableOpacity>
        )}
      </MotiView>
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontFamily: "Outfit_700Bold",
    color: Theme.colors.text.secondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  labelFocused: {
    color: Theme.colors.brand.primary,
  },
  inputContainer: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: Theme.colors.text.primary,
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    height: "100%",
  },
  toggle: {
    paddingLeft: 12,
  },
  inputError: {
    borderColor: Theme.colors.status.error,
  },
  errorText: {
    color: Theme.colors.status.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: "Outfit_600SemiBold",
  },
});
