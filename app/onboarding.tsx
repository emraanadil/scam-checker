import { useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { OnboardingSlide } from "../components/OnboardingSlide";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { useTheme } from "../constants/theme";
import { useSettings } from "../context/SettingsContext";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🛡️",
    title: "Protect Yourself From Scams",
    description:
      "Got a text, email, or letter that feels off? Scam Checker gives you a clear, plain-English answer in seconds.",
    gradient: ["#0B5FFF", "#5B93FF"] as [string, string],
  },
  {
    emoji: "📋",
    title: "Paste It, Photo It, Done",
    description:
      "Type or paste the message, or just take a photo of it. Tap \"Check It\" and we'll tell you what to watch out for.",
    gradient: ["#1E8E3E", "#4ADE80"] as [string, string],
  },
  {
    emoji: "🤝",
    title: "A Second Opinion, Not the Final Word",
    description:
      "This app uses AI and can make mistakes. When in doubt, don't click links or share information — call your bank or a family member you trust.",
    gradient: ["#B8860B", "#FBBF24"] as [string, string],
  },
];

export default function Onboarding() {
  const theme = useTheme();
  const { completeOnboarding } = useSettings();
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const isLastSlide = pageIndex === SLIDES.length - 1;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setPageIndex(index);
  }

  function goToNext() {
    if (isLastSlide) {
      completeOnboarding();
      router.replace("/(tabs)");
      return;
    }
    scrollRef.current?.scrollTo({ x: (pageIndex + 1) * width, animated: true });
  }

  function skip() {
    completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {!isLastSlide && (
        <View style={styles.skipRow}>
          <SecondaryButton label="Skip" onPress={skip} style={styles.skipButton} />
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.flex}
      >
        {SLIDES.map((slide) => (
          <OnboardingSlide key={slide.title} {...slide} />
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.title}
              style={[
                styles.dot,
                {
                  backgroundColor: index === pageIndex ? theme.colors.primary : theme.colors.border,
                  width: index === pageIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
        <PrimaryButton label={isLastSlide ? "Get Started" : "Next"} onPress={goToNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skipRow: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skipButton: {
    borderWidth: 0,
    minHeight: 40,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
