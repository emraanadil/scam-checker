import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { getVerdictTokens, useTheme } from "../constants/theme";
import type { CheckResult } from "../lib/api";

export function VerdictCard({ result }: { result: CheckResult }) {
  const theme = useTheme();
  const tokens = getVerdictTokens(theme, result.verdict);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
  }, [result]);

  return (
    <Animated.View
      style={[
        styles.card,
        theme.cardShadow,
        {
          backgroundColor: tokens.bg,
          borderColor: tokens.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          marginTop: theme.spacing.lg,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      accessible
      accessibilityRole="summary"
    >
      <Text style={styles.emoji}>{tokens.emoji}</Text>
      <Text
        style={[
          styles.label,
          { color: tokens.border, fontSize: theme.fontSize.verdict, marginBottom: theme.spacing.md },
        ]}
      >
        {tokens.label}
      </Text>
      <Text style={[styles.body, { color: theme.colors.text, fontSize: theme.fontSize.body }]}>
        {result.reason}
      </Text>
      <View style={[styles.divider, { backgroundColor: theme.colors.border, marginVertical: theme.spacing.md }]} />
      <Text
        style={[
          styles.actionLabel,
          { color: theme.colors.subtleText, fontSize: theme.fontSize.subtitle, marginBottom: theme.spacing.xs },
        ]}
      >
        What to do:
      </Text>
      <Text style={[styles.body, { color: theme.colors.text, fontSize: theme.fontSize.body }]}>
        {result.action}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3,
    alignItems: "center",
  },
  emoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  label: {
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    textAlign: "center",
    lineHeight: 28,
  },
  divider: {
    height: 1,
    alignSelf: "stretch",
  },
  actionLabel: {
    fontWeight: "700",
  },
});
