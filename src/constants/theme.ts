import { Platform } from "react-native";

export const Colors = {
  light: {
    orange: "#F97316",
    gold: "#FBBF24",
    cream: "#FEF3C7",

    background: "#FEF8F3",
    card: "#FFFFFF",

    foreground: "#1A1614",
    text: "#1A1614",

    muted: "#F5F5F4",
    mutedForeground: "#78716C",

    warmGray: "#78716C",

    border: "rgba(251, 191, 36, 0.15)",

    destructive: "#EF4444",

    greenDot: "#22C55E",

    backgroundElement: "#F5F5F4",
    backgroundSelected: "#FFF2E8",

    textSecondary: "#78716C",

    inputBackground: "#F5F5F4",

    quantityBackground: "#FFFFFF",

    glassBackground: "rgba(255,255,255,0.70)",
    glassBorder: "rgba(251,191,36,0.20)",

    shadowColor: "#F97316",

    white: "#FFFFFF",
    black: "#000000",
  },

  dark: {
    orange: "#F97316",
    gold: "#FBBF24",
    cream: "#FEF3C7",

    background: "#0F0E0D",
    card: "#1A1614",

    foreground: "#FEF8F3",
    text: "#FEF8F3",

    muted: "#2A2420",
    mutedForeground: "#A8A29E",

    warmGray: "#A8A29E",

    border: "rgba(251, 191, 36, 0.20)",

    destructive: "#EF4444",

    greenDot: "#22C55E",

    backgroundElement: "#2A2420",
    backgroundSelected: "#342A24",

    textSecondary: "#B0AAA5",

    inputBackground: "#2A2420",

    quantityBackground: "#211C19",

    glassBackground: "rgba(26,22,20,0.90)",
    glassBorder: "rgba(251,191,36,0.20)",

    shadowColor: "#000000",

    white: "#FFFFFF",
    black: "#000000",
  },
} as const;

export type ThemeColors = typeof Colors.light;

export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },

  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },

  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  small: 10,
  medium: 16,
  large: 20,
  extraLarge: 24,
  round: 999,
} as const;