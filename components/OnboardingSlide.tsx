import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../constants/theme";

interface Props {
  emoji: string;
  title: string;
  description: string;
  gradient: [string, string];
}

const { width } = Dimensions.get("window");

export function OnboardingSlide({ emoji, title, description, gradient }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient colors={gradient} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.emoji}>{emoji}</Text>
      </LinearGradient>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.title }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.subtleText, fontSize: theme.fontSize.body }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    lineHeight: 26,
  },
});
