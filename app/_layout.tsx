import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme,
} from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "[Reanimated] Reduced motion setting is enabled on this device.",
  "Sending `onAnimatedValueUpdate` with no listeners registered.",
]);

import "react-native-reanimated";

import { DiscoverPalettes } from "@/constants/discover";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";
  const theme = DiscoverPalettes[dark ? "dark" : "light"];
  const navTheme = useMemo<Theme>(
    () => ({
      ...(dark ? DarkTheme : DefaultTheme),
      colors: {
        ...(dark ? DarkTheme.colors : DefaultTheme.colors),
        primary: theme.accent,
        background: theme.bg,
        card: theme.bg,
        text: theme.ink,
        border: theme.line,
        notification: theme.accent,
      },
    }),
    [dark, theme]
  );

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.bg);
  }, [theme.bg]);

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen
          name="(users)/auth/login-user"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(users)/(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(users)/event/[id]"
          options={{ animation: "slide_from_right", gestureEnabled: true }}
        />
        <Stack.Screen
          name="(users)/event/[id]/tickets"
          options={{ animation: "slide_from_bottom", gestureEnabled: true }}
        />
      </Stack>
      <StatusBar style={theme.statusBar} />
    </ThemeProvider>
  );
}
