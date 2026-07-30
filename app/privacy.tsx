import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../constants/theme";

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "What we collect",
    body: "When you use \"Check It\", the text you type/paste or the photo you take/choose is sent to our server, which forwards it to Google's Gemini AI to generate a scam-likelihood verdict. We don't require an account, and we don't collect your name, email, or contacts.",
  },
  {
    heading: "What we don't do",
    body: "Our server does not store the text or photos you submit after generating a result. We don't sell or share your submissions with advertisers or data brokers, and we don't track you across other apps or websites.",
  },
  {
    heading: "History (stored only on your device)",
    body: "If \"Save check history\" is on in Settings (on by default), the app keeps a list of past checks — but only on your phone's local storage. It's never uploaded anywhere. You can turn it off or clear it anytime from Settings.",
  },
  {
    heading: "Third parties",
    body: "Submitted text/photos are processed by Google (Gemini API) solely to generate the scam-check result. This app currently uses Gemini's free tier, under which Google may use submitted data to improve their products.",
  },
  {
    heading: "Camera and photo permissions",
    body: "The app requests camera and photo library access only so you can capture or choose a photo of a suspicious message. These permissions are optional — you can use the app with typed/pasted text only.",
  },
];

export default function PrivacyScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <Text
        style={{
          color: theme.colors.subtleText,
          fontSize: theme.fontSize.caption,
          marginBottom: theme.spacing.lg,
        }}
      >
        Last updated: July 30, 2026
      </Text>
      {SECTIONS.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.fontSize.subtitle,
              fontWeight: "700",
              marginBottom: theme.spacing.xs,
            }}
          >
            {section.heading}
          </Text>
          <Text style={{ color: theme.colors.subtleText, fontSize: theme.fontSize.body, lineHeight: 26 }}>
            {section.body}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
});
