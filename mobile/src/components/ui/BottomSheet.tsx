import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Theme } from "@/constants/Theme";
import { BlurView } from "expo-blur";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
};

export function BottomSheet({
  isOpen,
  onClose,
  children,
  height = "80%",
}: BottomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  const sheetHeight =
    typeof height === "number"
      ? height
      : (SCREEN_HEIGHT * parseFloat(height)) / 100;

  useEffect(() => {
    if (isOpen) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(SCREEN_HEIGHT - sheetHeight, {
        damping: 20,
        stiffness: 100,
      });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [isOpen, sheetHeight, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isOpen && translateY.value === SCREEN_HEIGHT) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <BlurView
              intensity={20}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheet, { height: sheetHeight }, animatedStyle]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    width: "100%",
    position: "absolute",
    bottom: 0,
    // Add subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(148,163,184,0.2)",
  },
});
