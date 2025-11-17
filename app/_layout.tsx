import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

// Silenciar advertencias comunes
LogBox.ignoreLogs([
  '[Reanimated] Reduced motion setting is enabled on this device.',
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
]);

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>
        {/* Index/Splash screen - Primera pantalla que se muestra automáticamente */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Welcome screen - Pantalla de bienvenida */}
        <Stack.Screen name="welcome" options={{ headerShown: false }} />

        <Stack.Screen name="(users)/auth/login-user" options={{ headerShown: false }} />
        {/* Tabs - Navegación principal con tabs */}
        <Stack.Screen name="(users)/(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(users)/city" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
