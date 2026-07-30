import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { router } from "expo-router";
import { SegmentedControl } from "../../components/SegmentedControl";
import { SecondaryButton } from "../../components/SecondaryButton";
import { TEXT_SIZE_LABELS, useTheme } from "../../constants/theme";
import { useHistory } from "../../context/HistoryContext";
import { useSettings, type AppearanceSetting, type TextSize } from "../../context/SettingsContext";

const TEXT_SIZE_OPTIONS: { label: string; value: TextSize }[] = [
  { label: TEXT_SIZE_LABELS.normal, value: "normal" },
  { label: TEXT_SIZE_LABELS.large, value: "large" },
  { label: TEXT_SIZE_LABELS.extraLarge, value: "extraLarge" },
];

const APPEARANCE_OPTIONS: { label: string; value: AppearanceSetting }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        color: theme.colors.subtleText,
        fontSize: theme.fontSize.caption,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.md,
      }}
    >
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { textSize, setTextSize, appearance, setAppearance, historyEnabled, setHistoryEnabled } = useSettings();
  const { entries, clearAll } = useHistory();

  function confirmClearHistory() {
    Alert.alert("Clear all history?", "This deletes every saved check. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearAll },
    ]);
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.title }]}>Settings</Text>

        <SectionLabel>Text Size</SectionLabel>
        <SegmentedControl
          accessibilityLabel="Text size"
          options={TEXT_SIZE_OPTIONS}
          value={textSize}
          onChange={setTextSize}
        />

        <SectionLabel>Appearance</SectionLabel>
        <SegmentedControl
          accessibilityLabel="Appearance"
          options={APPEARANCE_OPTIONS}
          value={appearance}
          onChange={setAppearance}
        />

        <SectionLabel>History</SectionLabel>
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
            },
          ]}
        >
          <View style={styles.rowText}>
            <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.body, fontWeight: "600" }}>
              Save check history
            </Text>
            <Text style={{ color: theme.colors.subtleText, fontSize: theme.fontSize.caption, marginTop: 2 }}>
              Kept only on this device, never sent anywhere else.
            </Text>
          </View>
          <Switch
            value={historyEnabled}
            onValueChange={setHistoryEnabled}
            trackColor={{ true: theme.colors.primary }}
            accessibilityLabel="Save check history"
          />
        </View>
        {entries.length > 0 && (
          <SecondaryButton
            label="Clear History"
            tone="danger"
            onPress={confirmClearHistory}
            style={{ marginTop: theme.spacing.md, alignSelf: "flex-start" }}
          />
        )}

        <SectionLabel>About</SectionLabel>
        <SecondaryButton
          label="Privacy Policy"
          onPress={() => router.push("/privacy")}
          style={{ alignSelf: "flex-start" }}
        />
        <Text
          style={{
            color: theme.colors.subtleText,
            fontSize: theme.fontSize.caption,
            marginTop: theme.spacing.md,
          }}
        >
          Scam Checker version {Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: { flex: 1, marginRight: 12 },
});
