import { useState } from "react";
import {
  ActivityIndicator,
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
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { VerdictCard } from "./components/VerdictCard";
import { checkMessage, CheckRequestError, type CheckResult } from "./lib/api";
import { colors, fontSize, minTouchTarget, radius, spacing } from "./constants/theme";

interface SelectedPhoto {
  uri: string;
  base64: string;
  mediaType: string;
}

export default function App() {
  const [messageText, setMessageText] = useState("");
  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasInput = messageText.trim().length > 0 || photo !== null;

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

    if (pickerResult.canceled || !pickerResult.assets[0]) {
      return;
    }

    const asset = pickerResult.assets[0];
    if (!asset.base64) {
      Alert.alert("Something went wrong", "Couldn't read that photo. Please try again.");
      return;
    }

    setPhoto({
      uri: asset.uri,
      base64: asset.base64,
      mediaType: asset.mimeType ?? "image/jpeg",
    });
    setResult(null);
    setErrorMessage(null);
  }

  function clearPhoto() {
    setPhoto(null);
    setResult(null);
    setErrorMessage(null);
  }

  function resetAll() {
    setMessageText("");
    setPhoto(null);
    setResult(null);
    setErrorMessage(null);
  }

  async function handleCheck() {
    if (!hasInput || loading) return;
    setLoading(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const outcome = await checkMessage({
        text: messageText.trim() || undefined,
        imageBase64: photo?.base64,
        imageMediaType: photo?.mediaType,
      });
      setResult(outcome);
    } catch (err) {
      const message =
        err instanceof CheckRequestError
          ? err.message
          : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar style="dark" />
        <Text style={styles.title}>Scam Checker</Text>
        <Text style={styles.subtitle}>
          Got a suspicious text, email, or letter? Paste it or take a photo, and
          we'll tell you if it's safe.
        </Text>

        <Text style={styles.sectionLabel}>Type or paste the message</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Example: You've won a $1000 gift card, click here to claim..."
          placeholderTextColor={colors.subtleText}
          value={messageText}
          onChangeText={(value) => {
            setMessageText(value);
            setResult(null);
            setErrorMessage(null);
          }}
          accessibilityLabel="Message text to check"
        />

        <Text style={styles.sectionLabel}>Or use a photo instead</Text>
        {photo ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            <Pressable
              style={styles.removePhotoButton}
              onPress={clearPhoto}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.photoButtonRow}>
            <Pressable
              style={[styles.secondaryButton, styles.photoButton]}
              onPress={() => pickPhoto("camera")}
              accessibilityRole="button"
              accessibilityLabel="Take a photo of the message"
            >
              <Text style={styles.secondaryButtonText}>📷 Take Photo</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, styles.photoButton]}
              onPress={() => pickPhoto("library")}
              accessibilityRole="button"
              accessibilityLabel="Choose a photo from your library"
            >
              <Text style={styles.secondaryButtonText}>🖼️ Choose Photo</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={[
            styles.primaryButton,
            (!hasInput || loading) && styles.primaryButtonDisabled,
          ]}
          onPress={handleCheck}
          disabled={!hasInput || loading}
          accessibilityRole="button"
          accessibilityLabel="Check this message"
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.primaryButtonText}>Check It</Text>
          )}
        </Pressable>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {result && <VerdictCard result={result} />}

        {(result || errorMessage) && (
          <Pressable
            style={styles.resetButton}
            onPress={resetAll}
            accessibilityRole="button"
            accessibilityLabel="Check another message"
          >
            <Text style={styles.resetButtonText}>Check Another Message</Text>
          </Pressable>
        )}

        <Text style={styles.disclaimer}>
          This app uses AI and can make mistakes. When in doubt, don't click links
          or share personal information — call your bank or family using a number
          you already know and trust.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.subtleText,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 26,
  },
  sectionLabel: {
    fontSize: fontSize.subtitle,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  textInput: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    textAlignVertical: "top",
  },
  photoButtonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
  },
  photoPreviewWrap: {
    alignItems: "center",
  },
  photoPreview: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  removePhotoButton: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  removePhotoText: {
    fontSize: fontSize.subtitle,
    color: colors.scamBorder,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: minTouchTarget,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    fontSize: fontSize.subtitle,
    fontWeight: "700",
    color: colors.primary,
  },
  primaryButton: {
    minHeight: minTouchTarget + 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: fontSize.button,
    fontWeight: "800",
    color: colors.primaryText,
  },
  resetButton: {
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  resetButtonText: {
    fontSize: fontSize.subtitle,
    fontWeight: "700",
    color: colors.primary,
  },
  errorBox: {
    borderWidth: 2,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: "center",
  },
  disclaimer: {
    fontSize: 14,
    color: colors.subtleText,
    textAlign: "center",
    marginTop: spacing.xl,
    lineHeight: 20,
  },
});
