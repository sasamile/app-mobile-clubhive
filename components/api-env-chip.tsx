import {
  API_ENV_LABELS,
  API_HOST_LABELS,
  getApiEnvironment,
  subscribeApiEnvironment,
  type ApiEnvironment,
} from "@/lib/api-env";
import { isAuthenticated } from "@/lib/storage";
import { switchApiEnvironment } from "@/lib/switch-api-env";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

type Props = {
  align?: "left" | "center" | "right";
};

export function ApiEnvChip({ align = "center" }: Props) {
  const [env, setEnv] = useState<ApiEnvironment>(getApiEnvironment);

  useEffect(() => subscribeApiEnvironment(setEnv), []);

  return (
    <Pressable
      onPress={() => promptApiEnvironment()}
      hitSlop={8}
      style={[
        styles.chip,
        align === "left" && styles.left,
        align === "right" && styles.right,
      ]}
    >
      <Text style={styles.label}>
        {API_ENV_LABELS[env]} · {API_HOST_LABELS[env]}
      </Text>
    </Pressable>
  );
}

export function promptApiEnvironment() {
  const current = getApiEnvironment();

  const apply = (env: ApiEnvironment) => {
    if (env === current) return;
    Alert.alert(
      env === "dev" ? "Usar desarrollo" : "Usar producción",
      `La app hablará con ${API_HOST_LABELS[env]}. Si hay una sesión abierta, se cerrará.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cambiar",
          onPress: () => {
            void (async () => {
              const wasAuth = await isAuthenticated();
              await switchApiEnvironment(env);
              if (wasAuth) router.replace("/welcome");
            })();
          },
        },
      ]
    );
  };

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Entorno de API",
        message: "Elige si la app usa producción o desarrollo.",
        options: [
          "Cancelar",
          "Producción (api.tiked.co)",
          "Desarrollo (dev.tiked.co)",
        ],
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index === 1) apply("prod");
        if (index === 2) apply("dev");
      }
    );
    return;
  }

  Alert.alert("Entorno de API", "Elige el servidor.", [
    { text: "Producción", onPress: () => apply("prod") },
    { text: "Desarrollo", onPress: () => apply("dev") },
    { text: "Cancelar", style: "cancel" },
  ]);
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  left: {
    alignSelf: "flex-start",
  },
  right: {
    alignSelf: "flex-end",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
});
