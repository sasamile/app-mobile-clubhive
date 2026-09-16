import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme,
} from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import { Stack } from "expo-router";
import { useEffect, useMemo } from "react";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "[Reanimated] Reduced motion setting is enabled on this device.",
  "Sending `onAnimatedValueUpdate` with no listeners registered.",
]);

import "react-native-reanimated";

import { DiscoverPalettes } from "@/constants/discover";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { loadApiEnvironment } from "@/lib/api-env";

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
    void loadApiEnvironment();
    void SystemUI.setBackgroundColorAsync(theme.bg);
  }, [theme.bg]);

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: theme.bg },
          statusBarStyle: dark ? "light" : "dark",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="welcome"
          options={{ headerShown: false, statusBarStyle: "light" }}
        />
        <Stack.Screen
          name="(users)/auth/login-user"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(users)/auth/login-organizer"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "#000000" },
            statusBarStyle: "light",
          }}
        />
        <Stack.Screen
          name="(users)/auth/signup-organizer"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "#000000" },
            statusBarStyle: "light",
          }}
        />
        <Stack.Screen
          name="(users)/auth/confirm-organizer"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "#000000" },
            statusBarStyle: "light",
          }}
        />
        <Stack.Screen name="(users)/(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(organizer)"
          options={{ headerShown: false, statusBarStyle: "light" }}
        />
        <Stack.Screen
          name="(users)/event/[id]"
          options={{ animation: "slide_from_right", gestureEnabled: true }}
        />
        <Stack.Screen
          name="(users)/event/[id]/tickets"
          options={{ animation: "slide_from_bottom", gestureEnabled: true }}
        />
      </Stack>
    </ThemeProvider>
  );
}
