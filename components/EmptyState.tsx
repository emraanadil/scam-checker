import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../constants/theme";

interface Props {
  emoji: string;
  title: string;
  message: string;
}

export function EmptyState({ emoji, title, message }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { fontSize: theme.fontSize.subtitle, color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { fontSize: theme.fontSize.body, color: theme.colors.subtleText }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    textAlign: "center",
    lineHeight: 24,
  },
});
