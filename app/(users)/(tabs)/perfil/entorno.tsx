import { ScreenAtmosphere } from "@/components/discover/screen-atmosphere";
import { FLOATING_TAB_INSET } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import {
  API_ENV_LABELS,
  API_HOST_LABELS,
  getApiEnvironment,
  subscribeApiEnvironment,
  type ApiEnvironment,
} from "@/lib/api-env";
import { isAuthenticated } from "@/lib/storage";
import { switchApiEnvironment } from "@/lib/switch-api-env";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OPTIONS: { env: ApiEnvironment; title: string; hint: string }[] = [
  {
    env: "prod",
    title: "Producción",
    hint: "api.tiked.co — eventos y cuentas reales.",
  },
  {
    env: "dev",
    title: "Desarrollo",
    hint: "dev.tiked.co — datos de prueba.",
  },
];

export default function EntornoScreen() {
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();
  const [env, setEnv] = useState<ApiEnvironment>(getApiEnvironment);

  useEffect(() => subscribeApiEnvironment(setEnv), []);

  const choose = (next: ApiEnvironment) => {
    if (next === env) return;
    Alert.alert(
      `Cambiar a ${API_ENV_LABELS[next]}`,
      `La app hablará con ${API_HOST_LABELS[next]}. Si hay una sesión abierta, se cerrará.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cambiar",
          onPress: () => {
            void (async () => {
              const wasAuth = await isAuthenticated();
              await switchApiEnvironment(next);
              if (wasAuth) {
                router.replace("/welcome");
                return;
              }
              setEnv(next);
            })();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ title: "Entorno" }} />
      <StatusBar style={theme.statusBar} />
      <ScreenAtmosphere height={180} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: FLOATING_TAB_INSET + insets.bottom,
        }}
      >
        <Text style={[styles.lead, { color: theme.muted }]}>
          Elige si la app usa el API de producción o el de desarrollo, igual
          que en la web.
        </Text>
        <View
          style={[
            styles.group,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          {OPTIONS.map((option, index) => {
            const selected = option.env === env;
            return (
              <View key={option.env}>
                {index > 0 ? (
                  <View
                    style={[styles.separator, { backgroundColor: theme.line }]}
                  />
                ) : null}
                <Pressable
                  onPress={() => choose(option.env)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Ionicons
                      name={option.env === "prod" ? "globe-outline" : "flask-outline"}
                      size={18}
                      color={theme.ink}
                    />
                  </View>
                  <View style={styles.copy}>
                    <Text style={[styles.title, { color: theme.ink }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.hint, { color: theme.muted }]}>
                      {option.hint}
                    </Text>
                  </View>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={theme.accent}
                    />
                  ) : (
                    <View style={styles.radio} />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  group: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(127,127,127,0.4)",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
});
