import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ViewStyle,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

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
            ? "#f43f5e"
            : isFocused
              ? "#818cf8"
              : "rgba(255, 255, 255, 0.1)",
          backgroundColor: isFocused
            ? "rgba(129, 140, 248, 0.05)"
            : "rgba(255, 255, 255, 0.05)",
        }}
        transition={{ type: "timing", duration: 200 }}
        style={[styles.inputContainer, error ? styles.inputError : {}]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          secureTextEntry={isPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePassword}
            style={styles.toggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={20} color="#94a3b8" />
            ) : (
              <Eye size={20} color="#94a3b8" />
            )}
          </TouchableOpacity>
        )}
      </MotiView>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 12, // More compact label
    fontFamily: "Outfit_700Bold",
    color: "#64748b",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  labelFocused: {
    color: "#818cf8",
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
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    height: "100%",
  },
  toggle: {
    paddingLeft: 12,
  },
  inputError: {
    borderColor: "#f43f5e",
  },
  errorText: {
    color: "#f43f5e",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: "Outfit_600SemiBold",
  },
});
