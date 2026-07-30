import { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../constants/theme";

interface Props {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "danger";
  accessibilityLabel?: string;
}

export function SecondaryButton({ label, onPress, disabled, style, tone = "default", accessibilityLabel }: Props) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const tintColor = tone === "danger" ? theme.colors.scamBorder : theme.colors.primary;

  function pressIn() {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  }

  function handlePress(event: GestureResponderEvent) {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(event);
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={[
          styles.base,
          {
            minHeight: theme.minTouchTarget,
            borderRadius: theme.radius.md,
            borderColor: tintColor,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        <Text style={[styles.label, { fontSize: theme.fontSize.subtitle, color: tintColor }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  label: {
    fontWeight: "700",
  },
});
