import { ScreenAtmosphere } from "@/components/discover/screen-atmosphere";
import { FLOATING_TAB_INSET } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import {
  API_ENV_LABELS,
  getApiEnvironment,
  subscribeApiEnvironment,
  type ApiEnvironment,
} from "@/lib/api-env";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState, type ComponentProps } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { signOutFromGoogle } from "@/lib/auth/google";
import { clearUserLocalCache } from "@/lib/local-cache";
import {
  clearAuthData,
  getSelectedCity,
  getUserData,
  removeSelectedCity,
  type User,
} from "@/lib/storage";
import { resolveProfileImage } from "@/lib/user-profile";

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();
  const [user, setUser] = useState<User | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [apiEnv, setApiEnv] = useState<ApiEnvironment>(getApiEnvironment);

  useEffect(() => subscribeApiEnvironment(setApiEnv), []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const saved = await getUserData();
        setUser(saved);
        setPhotoUrl(await resolveProfileImage(saved));
        const city = await getSelectedCity();
        setCityName(city?.name ?? null);
        setApiEnv(getApiEnvironment());
      })();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "Vas a salir de tu cuenta en este dispositivo.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          try {
            await signOutFromGoogle();
            await clearAuthData();
            await removeSelectedCity();
            await clearUserLocalCache();
          } finally {
            router.replace("/(users)/auth/login-user");
          }
        },
      },
    ]);
  };

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={theme.statusBar} />
      <ScreenAtmosphere height={220} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: FLOATING_TAB_INSET + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: theme.ink }]}>Perfil</Text>
        <View style={styles.identity}>
          <Pressable
            onPress={() => router.push("/(users)/(tabs)/perfil/editar")}
            style={styles.avatarHit}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={[styles.avatar, { backgroundColor: theme.chip }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={[styles.editBadge, { borderColor: theme.bg }]}>
              <Ionicons name="pencil" size={12} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={[styles.name, { color: theme.ink }]} numberOfLines={2}>
            {user?.name || "Usuario"}
          </Text>
          <Text style={[styles.email, { color: theme.muted }]} numberOfLines={1}>
            {user?.email || ""}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>Ajustes</Text>
        <View
          style={[
            styles.group,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Row
            icon="person-outline"
            label="Editar perfil"
            onPress={() => router.push("/(users)/(tabs)/perfil/editar")}
          />
          <View style={[styles.separator, { backgroundColor: theme.line }]} />
          <Row
            icon="location-outline"
            label="Ubicación"
            value={cityName ?? "Elegir ciudad"}
            onPress={() => router.push("/(users)/(tabs)/perfil/ubicacion")}
          />
          <View style={[styles.separator, { backgroundColor: theme.line }]} />
          <Row
            icon="server-outline"
            label="Entorno"
            value={API_ENV_LABELS[apiEnv]}
            onPress={() => router.push("/(users)/(tabs)/perfil/entorno")}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>Legal</Text>
        <View
          style={[
            styles.group,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Row
            icon="document-text-outline"
            label="Términos y condiciones"
            onPress={() => router.push("/(users)/(tabs)/perfil/terminos")}
          />
          <View style={[styles.separator, { backgroundColor: theme.line }]} />
          <Row
            icon="shield-checkmark-outline"
            label="Política de privacidad"
            onPress={() => router.push("/(users)/(tabs)/perfil/privacidad")}
          />
        </View>

        <View
          style={[
            styles.group,
            styles.logoutGroup,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Row
            icon="log-out-outline"
            label="Cerrar sesión"
            destructive
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useDiscoverTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.surfaceMuted },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.surfaceMuted },
          destructive && styles.iconWrapDestructive,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? "#E11D48" : theme.ink}
        />
      </View>
      <Text
        style={[
          styles.rowLabel,
          { color: theme.ink },
          destructive && styles.rowLabelDestructive,
        ]}
      >
        {label}
      </Text>
      {value ? (
        <Text style={[styles.rowValue, { color: theme.muted }]}>{value}</Text>
      ) : null}
      {destructive ? null : (
        <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.9,
    marginBottom: 18,
  },
  identity: {
    alignItems: "center",
    paddingBottom: 28,
    gap: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarHit: {
    marginBottom: 6,
  },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#7C4DFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  email: {
    fontSize: 15,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logoutGroup: {
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    minHeight: 52,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapDestructive: {
    backgroundColor: "rgba(225,29,72,0.1)",
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  rowLabelDestructive: {
    color: "#E11D48",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "500",
    maxWidth: 160,
    textAlign: "right",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
});
