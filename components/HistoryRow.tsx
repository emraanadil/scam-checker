import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { getVerdictTokens, useTheme } from "../constants/theme";
import type { HistoryEntry } from "../context/HistoryContext";
import { formatRelativeTime } from "../lib/time";

interface Props {
  entry: HistoryEntry;
  onPress: () => void;
  onDelete: () => void;
}

export function HistoryRow({ entry, onPress, onDelete }: Props) {
  const theme = useTheme();
  const tokens = getVerdictTokens(theme, entry.verdict);

  function confirmDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Delete this check?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tokens.label}. ${entry.snippet}. ${formatRelativeTime(entry.timestamp)}`}
      style={[
        styles.row,
        theme.cardShadow,
        {
          backgroundColor: theme.colors.background,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tokens.border }]} />
      <View style={styles.content}>
        <Text style={[styles.verdictLabel, { color: tokens.border, fontSize: theme.fontSize.caption + 1 }]}>
          {tokens.label}
        </Text>
        <Text
          style={[styles.snippet, { color: theme.colors.text, fontSize: theme.fontSize.body }]}
          numberOfLines={2}
        >
          {entry.inputType === "photo" ? "📷 Photo submitted" : entry.snippet}
        </Text>
        <Text style={[styles.time, { color: theme.colors.subtleText, fontSize: theme.fontSize.caption }]}>
          {formatRelativeTime(entry.timestamp)}
        </Text>
      </View>
      <Pressable
        onPress={confirmDelete}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Delete this check"
        style={styles.deleteButton}
      >
        <Text style={{ fontSize: 20 }}>🗑️</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  verdictLabel: {
    fontWeight: "700",
    marginBottom: 2,
  },
  snippet: {
    marginBottom: 4,
  },
  time: {},
  deleteButton: {
    paddingLeft: 12,
  },
});
