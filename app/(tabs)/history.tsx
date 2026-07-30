import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyState";
import { HistoryRow } from "../../components/HistoryRow";
import { SecondaryButton } from "../../components/SecondaryButton";
import { VerdictCard } from "../../components/VerdictCard";
import { useTheme } from "../../constants/theme";
import { useHistory, type HistoryEntry } from "../../context/HistoryContext";
import { formatFullDate } from "../../lib/time";

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries, removeEntry, clearAll } = useHistory();
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  function confirmClearAll() {
    Alert.alert("Clear all history?", "This deletes every saved check. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearAll },
    ]);
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.title }]}>History</Text>
        {entries.length > 0 && <SecondaryButton label="Clear All" tone="danger" onPress={confirmClearAll} />}
      </View>

      {entries.length === 0 ? (
        <EmptyState
          emoji="🕘"
          title="No checks yet"
          message="Messages you check will show up here so you can look back at them anytime."
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.lg }}
          renderItem={({ item }) => (
            <HistoryRow entry={item} onPress={() => setSelected(item)} onDelete={() => removeEntry(item.id)} />
          )}
        />
      )}

      <Modal visible={selected !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { paddingHorizontal: theme.spacing.lg }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: theme.fontSize.subtitle }]}>
              {selected ? formatFullDate(selected.timestamp) : ""}
            </Text>
            <Pressable onPress={() => setSelected(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={{ fontSize: theme.fontSize.subtitle, color: theme.colors.primary, fontWeight: "700" }}>
                Done
              </Text>
            </Pressable>
          </View>
          {selected && (
            <View style={{ padding: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.subtleText, fontSize: theme.fontSize.body, marginBottom: 8 }}>
                {selected.inputType === "photo" ? "📷 Photo submitted" : selected.snippet}
              </Text>
              <VerdictCard result={selected} />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: { fontWeight: "800" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  modalTitle: { fontWeight: "700" },
});
