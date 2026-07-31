// Shared brand tokens — kept in sync with the mobile app's constants/theme.ts
//
// Assigned onto `window` (not `const`) because background.js re-injects this
// file into the same tab's isolated world on every right-click. Chrome's
// isolated world persists across separate executeScript calls within a tab's
// lifetime, so a top-level `const` throws "already declared" on the second
// injection — plain assignment is safe to repeat.
window.THEME = {
  light: {
    background: "#FFFFFF",
    surface: "#F6F7F9",
    text: "#161616",
    subtleText: "#5B5F66",
    primary: "#0B5FFF",
    primaryText: "#FFFFFF",
    border: "#E1E4E8",
  },
  dark: {
    background: "#0E0F12",
    surface: "#1A1C20",
    text: "#F2F3F5",
    subtleText: "#A7ACB3",
    primary: "#5B93FF",
    primaryText: "#0B0E14",
    border: "#2B2E33",
  },
};

window.VERDICT_TOKENS = {
  scam: {
    emoji: "⚠️",
    label: "Likely a Scam",
    light: { bg: "#FDECEC", border: "#D0342C", text: "#7A1712" },
    dark: { bg: "#3A1414", border: "#FF6B60", text: "#FFD9D6" },
  },
  legitimate: {
    emoji: "✅",
    label: "Looks Legitimate",
    light: { bg: "#EAF7EC", border: "#1E8E3E", text: "#0F4D22" },
    dark: { bg: "#12321A", border: "#4ADE80", text: "#D6FBE3" },
  },
  uncertain: {
    emoji: "❓",
    label: "Not Sure — Be Careful",
    light: { bg: "#FFF6E5", border: "#B8860B", text: "#5C4406" },
    dark: { bg: "#3A2E0A", border: "#FBBF24", text: "#FFEFC7" },
  },
  error: {
    emoji: "⚠️",
    label: "Couldn't Complete the Check",
    light: { bg: "#FDECEC", border: "#D0342C", text: "#7A1712" },
    dark: { bg: "#3A1414", border: "#FF6B60", text: "#FFD9D6" },
  },
};
