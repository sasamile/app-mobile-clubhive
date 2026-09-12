import { Platform } from "react-native";

export type DiscoverPalette = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  muted: string;
  line: string;
  chip: string;
  accent: string;
  sky: string;
  skyMid: string;
  washEnd: string;
  statusBar: "light" | "dark";
  tabInactive: string;
};

export const DiscoverPalettes: Record<"light" | "dark", DiscoverPalette> = {
  light: {
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceMuted: "#F6F7F9",
    ink: "#0A0A0A",
    muted: "#6B7280",
    line: "#ECECEF",
    chip: "#F3F4F6",
    accent: "#7C4DFF",
    sky: "#D4C4FF",
    skyMid: "#EDE4FF",
    washEnd: "#F7F3FF",
    statusBar: "dark",
    tabInactive: "#52525B",
  },
  dark: {
    bg: "#000000",
    surface: "#161618",
    surfaceMuted: "#242428",
    ink: "#FFFFFF",
    muted: "#8E8E93",
    line: "#2C2C2E",
    chip: "#2C2C2E",
    accent: "#7C4DFF",
    sky: "#4B2E9E",
    skyMid: "#1C1238",
    washEnd: "#0A0618",
    statusBar: "light",
    tabInactive: "#A1A1AA",
  },
};

export const Discover = {
  ...DiscoverPalettes.light,
  radius: {
    card: 18,
    pill: 999,
    search: 18,
    chip: 999,
  },
  pad: 20,
} as const;

export const DisplayFont = Platform.select({
  ios: "AvenirNextCondensed-Heavy",
  android: "sans-serif-condensed",
  default: "System",
});

export const CATEGORIES = [
  "Todos",
  "Música",
  "Festivales",
  "Gastronomía",
  "Negocios",
  "Deportes",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const FLOATING_TAB_INSET = 88;
