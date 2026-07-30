import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../constants/theme";
import type { CheckResult } from "../lib/api";

const VERDICT_COPY: Record<
  CheckResult["verdict"],
  { emoji: string; label: string; bg: string; border: string }
> = {
  scam: {
    emoji: "⚠️",
    label: "Likely a Scam",
    bg: colors.scamBg,
    border: colors.scamBorder,
  },
  legitimate: {
    emoji: "✅",
    label: "Looks Legitimate",
    bg: colors.legitimateBg,
    border: colors.legitimateBorder,
  },
  uncertain: {
    emoji: "❓",
    label: "Not Sure — Be Careful",
    bg: colors.uncertainBg,
    border: colors.uncertainBorder,
  },
};

export function VerdictCard({ result }: { result: CheckResult }) {
  const copy = VERDICT_COPY[result.verdict];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: copy.bg, borderColor: copy.border },
      ]}
      accessible
      accessibilityRole="summary"
    >
      <Text style={styles.emoji}>{copy.emoji}</Text>
      <Text style={[styles.label, { color: copy.border }]}>{copy.label}</Text>
      <Text style={styles.reason}>{result.reason}</Text>
      <View style={styles.divider} />
      <Text style={styles.actionLabel}>What to do:</Text>
      <Text style={styles.action}>{result.action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
  },
  emoji: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.verdict,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  reason: {
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: "center",
    lineHeight: 28,
  },
  divider: {
    height: 1,
    alignSelf: "stretch",
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  actionLabel: {
    fontSize: fontSize.subtitle,
    fontWeight: "700",
    color: colors.subtleText,
    marginBottom: spacing.sm / 2,
  },
  action: {
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: "center",
    lineHeight: 28,
  },
});
