import { Platform, useColorScheme, type ViewStyle } from "react-native";
import { useSettings, type TextSize } from "../context/SettingsContext";
import type { Verdict } from "../lib/api";

const lightColors = {
  background: "#FFFFFF",
  surface: "#F6F7F9",
  text: "#161616",
  subtleText: "#5B5F66",
  primary: "#0B5FFF",
  primaryText: "#FFFFFF",
  border: "#E1E4E8",
  scamBg: "#FDECEC",
  scamBorder: "#D0342C",
  legitimateBg: "#EAF7EC",
  legitimateBorder: "#1E8E3E",
  uncertainBg: "#FFF6E5",
  uncertainBorder: "#B8860B",
  errorBg: "#FDECEC",
  errorBorder: "#D0342C",
};

const darkColors: typeof lightColors = {
  background: "#0E0F12",
  surface: "#1A1C20",
  text: "#F2F3F5",
  subtleText: "#A7ACB3",
  primary: "#5B93FF",
  primaryText: "#0B0E14",
  border: "#2B2E33",
  scamBg: "#3A1414",
  scamBorder: "#FF6B60",
  legitimateBg: "#12321A",
  legitimateBorder: "#4ADE80",
  uncertainBg: "#3A2E0A",
  uncertainBorder: "#FBBF24",
  errorBg: "#3A1414",
  errorBorder: "#FF6B60",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const baseFontSize = {
  caption: 13,
  body: 17,
  subtitle: 17,
  button: 19,
  title: 28,
  verdict: 24,
};

export const TEXT_SIZE_SCALE: Record<TextSize, number> = {
  normal: 1,
  large: 1.15,
  extraLarge: 1.3,
};

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  normal: "Normal",
  large: "Large",
  extraLarge: "Extra Large",
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const minTouchTarget = 56;

export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
}) as ViewStyle;

export interface Theme {
  colors: typeof lightColors;
  fontSize: typeof baseFontSize;
  spacing: typeof spacing;
  radius: typeof radius;
  minTouchTarget: number;
  cardShadow: ViewStyle;
  isDark: boolean;
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const { appearance, textSize } = useSettings();

  const isDark = appearance === "system" ? systemScheme === "dark" : appearance === "dark";
  const colors = isDark ? darkColors : lightColors;
  const scale = TEXT_SIZE_SCALE[textSize];

  const fontSize = {
    caption: Math.round(baseFontSize.caption * scale),
    body: Math.round(baseFontSize.body * scale),
    subtitle: Math.round(baseFontSize.subtitle * scale),
    button: Math.round(baseFontSize.button * scale),
    title: Math.round(baseFontSize.title * scale),
    verdict: Math.round(baseFontSize.verdict * scale),
  };

  return { colors, fontSize, spacing, radius, minTouchTarget, cardShadow, isDark };
}

export function getVerdictTokens(theme: Theme, verdict: Verdict) {
  const map = {
    scam: { emoji: "⚠️", label: "Likely a Scam", bg: theme.colors.scamBg, border: theme.colors.scamBorder },
    legitimate: {
      emoji: "✅",
      label: "Looks Legitimate",
      bg: theme.colors.legitimateBg,
      border: theme.colors.legitimateBorder,
    },
    uncertain: {
      emoji: "❓",
      label: "Not Sure — Be Careful",
      bg: theme.colors.uncertainBg,
      border: theme.colors.uncertainBorder,
    },
  };
  return map[verdict];
}
