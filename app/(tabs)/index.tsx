import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { VerdictCard } from "../../components/VerdictCard";
import { SegmentedControl } from "../../components/SegmentedControl";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SecondaryButton } from "../../components/SecondaryButton";
import { useTheme, getVerdictTokens } from "../../constants/theme";
import { useSettings } from "../../context/SettingsContext";
import { useHistory } from "../../context/HistoryContext";
import { checkMessage, CheckRequestError, type CheckResult } from "../../lib/api";
import { formatRelativeTime } from "../../lib/time";

interface SelectedPhoto {
  uri: string;
  base64: string;
  mediaType: string;
}

const SNIPPET_LIMIT = 140;

function toSnippet(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > SNIPPET_LIMIT ? `${trimmed.slice(0, SNIPPET_LIMIT)}…` : trimmed;
}

export default function CheckScreen() {
  const theme = useTheme();
  const { historyEnabled } = useSettings();
  const { entries, addEntry } = useHistory();

  const [inputMode, setInputMode] = useState<"text" | "photo">("text");
  const [messageText, setMessageText] = useState("");
  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasInput = inputMode === "text" ? messageText.trim().length > 0 : photo !== null;

  async function pickPhoto(source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        source === "camera"
          ? "Please allow camera access to take a photo of the message."
          : "Please allow photo access to choose a picture of the message."
      );
      return;
    }

    const pickerResult =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });

    if (pickerResult.canceled || !pickerResult.assets[0]) return;

    const asset = pickerResult.assets[0];
    if (!asset.base64) {
      Alert.alert("Something went wrong", "Couldn't read that photo. Please try again.");
      return;
    }

    setPhoto({ uri: asset.uri, base64: asset.base64, mediaType: asset.mimeType ?? "image/jpeg" });
    setResult(null);
    setErrorMessage(null);
  }

  function switchMode(mode: "text" | "photo") {
    setInputMode(mode);
    setResult(null);
    setErrorMessage(null);
  }

  function resetAll() {
    setMessageText("");
    setPhoto(null);
    setResult(null);
    setErrorMessage(null);
  }

  async function playVerdictHaptic(verdict: CheckResult["verdict"]) {
    if (verdict === "scam") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (verdict === "legitimate") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  async function handleCheck() {
    if (!hasInput || loading) return;
    setLoading(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const outcome = await checkMessage({
        text: inputMode === "text" ? messageText.trim() : undefined,
        imageBase64: photo?.base64,
        imageMediaType: photo?.mediaType,
      });
      setResult(outcome);
      playVerdictHaptic(outcome.verdict);

      if (historyEnabled) {
        addEntry({
          verdict: outcome.verdict,
          reason: outcome.reason,
          action: outcome.action,
          inputType: inputMode,
          snippet: inputMode === "text" ? toSnippet(messageText) : "Photo submitted",
        });
      }
    } catch (err) {
      const message =
        err instanceof CheckRequestError ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  const recentEntry = entries[0];
  const showRecentTeaser = !result && !errorMessage && !loading && recentEntry;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.title }]}>
            Scam Checker
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.subtleText, fontSize: theme.fontSize.body, marginBottom: theme.spacing.lg },
            ]}
          >
            Got a suspicious text, email, or letter? We'll give you a plain answer.
          </Text>

          <SegmentedControl
            accessibilityLabel="Choose how to submit the message"
            options={[
              { label: "✍️ Type / Paste", value: "text" },
              { label: "📷 Photo", value: "photo" },
            ]}
            value={inputMode}
            onChange={switchMode}
          />

          <View style={{ marginTop: theme.spacing.lg }}>
            {inputMode === "text" ? (
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    color: theme.colors.text,
                    fontSize: theme.fontSize.body,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                multiline
                placeholder="Example: You've won a $1000 gift card, click here to claim..."
                placeholderTextColor={theme.colors.subtleText}
                value={messageText}
                onChangeText={(value) => {
                  setMessageText(value);
                  setResult(null);
                  setErrorMessage(null);
                }}
                accessibilityLabel="Message text to check"
              />
            ) : photo ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: photo.uri }} style={[styles.photoPreview, { borderRadius: theme.radius.md }]} />
                <SecondaryButton
                  label="Remove Photo"
                  tone="danger"
                  onPress={() => {
                    setPhoto(null);
                    setResult(null);
                    setErrorMessage(null);
                  }}
                  style={styles.removePhotoButton}
                />
              </View>
            ) : (
              <View style={styles.photoButtonRow}>
                <SecondaryButton
                  label="📷 Take Photo"
                  onPress={() => pickPhoto("camera")}
                  style={styles.photoButton}
                  accessibilityLabel="Take a photo of the message"
                />
                <SecondaryButton
                  label="🖼️ Choose Photo"
                  onPress={() => pickPhoto("library")}
                  style={styles.photoButton}
                  accessibilityLabel="Choose a photo from your library"
                />
              </View>
            )}
          </View>

          <PrimaryButton
            label="Check It"
            onPress={handleCheck}
            disabled={!hasInput}
            loading={loading}
            style={{ marginTop: theme.spacing.lg }}
            accessibilityLabel="Check this message"
          />
          {loading && (
            <Text
              style={[
                styles.loadingHint,
                { color: theme.colors.subtleText, fontSize: theme.fontSize.caption, marginTop: theme.spacing.sm },
              ]}
            >
              Checking... this takes about 10 seconds
            </Text>
          )}

          {errorMessage && (
            <View
              style={[
                styles.errorBox,
                {
                  borderColor: theme.colors.errorBorder,
                  backgroundColor: theme.colors.errorBg,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  marginTop: theme.spacing.lg,
                },
              ]}
            >
              <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.body, textAlign: "center" }}>
                {errorMessage}
              </Text>
            </View>
          )}

          {result && <VerdictCard result={result} />}

          {(result || errorMessage) && (
            <SecondaryButton
              label="Check Another Message"
              onPress={resetAll}
              style={{ marginTop: theme.spacing.lg, alignSelf: "center" }}
              accessibilityLabel="Check another message"
            />
          )}

          {showRecentTeaser && (
            <Pressable
              onPress={() => router.push("/(tabs)/history")}
              style={[
                styles.teaser,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  marginTop: theme.spacing.xl,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="View your check history"
            >
              <Text style={{ color: theme.colors.subtleText, fontSize: theme.fontSize.caption }}>
                Last checked {formatRelativeTime(recentEntry.timestamp)}
              </Text>
              <Text
                style={{ color: getVerdictTokens(theme, recentEntry.verdict).border, fontSize: theme.fontSize.body, fontWeight: "700" }}
              >
                {getVerdictTokens(theme, recentEntry.verdict).label} — view history →
              </Text>
            </Pressable>
          )}

          <Text
            style={[
              styles.disclaimer,
              { color: theme.colors.subtleText, fontSize: theme.fontSize.caption, marginTop: theme.spacing.xl },
            ]}
          >
            This app uses AI and can make mistakes. When in doubt, don't click links or share personal
            information — call your bank or family using a number you already know and trust.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 48 },
  title: { fontWeight: "800", textAlign: "center" },
  subtitle: { textAlign: "center", lineHeight: 26 },
  textInput: {
    minHeight: 120,
    borderWidth: 2,
    padding: 16,
    textAlignVertical: "top",
  },
  photoButtonRow: { flexDirection: "row", gap: 16 },
  photoButton: { flex: 1 },
  photoPreviewWrap: { alignItems: "center" },
  photoPreview: { width: "100%", height: 220, marginBottom: 12 },
  removePhotoButton: { alignSelf: "center" },
  loadingHint: { textAlign: "center" },
  errorBox: {},
  teaser: {},
  disclaimer: { textAlign: "center", lineHeight: 20 },
});
