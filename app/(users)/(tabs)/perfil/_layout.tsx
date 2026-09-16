import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { Stack } from "expo-router";
import { Platform, View } from "react-native";

export default function PerfilStack() {
  const theme = useDiscoverTheme();
  const dark = theme.statusBar === "light";

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack
        screenOptions={{
          animation: Platform.OS === "ios" ? "default" : "slide_from_right",
          headerBackTitle: "Perfil",
          headerBackButtonDisplayMode: "default",
          headerTintColor: theme.ink,
          headerTitleStyle: { color: theme.ink, fontWeight: "600" },
          headerShadowVisible: false,
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect: dark
            ? "systemChromeMaterialDark"
            : "systemChromeMaterial",
          headerStyle: {
            backgroundColor: Platform.OS === "ios" ? "transparent" : theme.bg,
          },
          headerLargeTitle: Platform.OS === "ios",
          headerLargeTitleStyle: { color: theme.ink },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerShown: false, title: "Perfil" }}
        />
        <Stack.Screen name="editar" options={{ title: "Editar perfil" }} />
        <Stack.Screen name="ubicacion" options={{ title: "Ubicación" }} />
        <Stack.Screen name="entorno" options={{ title: "Entorno" }} />
        <Stack.Screen
          name="terminos"
          options={{ title: "Términos y condiciones" }}
        />
        <Stack.Screen name="privacidad" options={{ title: "Privacidad" }} />
      </Stack>
    </View>
  );
}
