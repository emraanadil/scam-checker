import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../constants/theme";

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const theme = useTheme();

  return (
    <View
      style={[styles.track, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (option.value !== value) {
                Haptics.selectionAsync();
                onChange(option.value);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
            style={[
              styles.segment,
              {
                minHeight: theme.minTouchTarget - 8,
                borderRadius: theme.radius.sm,
                backgroundColor: isActive ? theme.colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={{
                fontSize: theme.fontSize.caption + 2,
                fontWeight: "700",
                color: isActive ? theme.colors.primaryText : theme.colors.subtleText,
              }}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
});
