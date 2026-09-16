import { ApiEnvChip } from "@/components/api-env-chip";
import { clearAuthData, getUserData, type User } from "@/lib/storage";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#7C4DFF";

export default function OrganizerProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getUserData().then(setUser);
    }, [])
  );

  const logout = () => {
    Alert.alert("Cerrar sesión", "Vas a salir de tu cuenta de organizador.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await clearAuthData();
          router.replace("/welcome");
        },
      },
    ]);
  };

  const initial = (user?.name ?? "O").slice(0, 1).toUpperCase();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <StatusBar style="light" />
      <Text style={styles.title}>Perfil</Text>

      <View style={styles.identity}>
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name || "Organizador"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
      </View>

      <View style={styles.env}>
        <Text style={styles.envLabel}>Entorno</Text>
        <ApiEnvChip align="left" />
      </View>

      <Pressable onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    marginBottom: 28,
  },
  identity: {
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#222",
    marginBottom: 8,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
  },
  env: {
    gap: 10,
    marginBottom: 28,
  },
  envLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
  },
  logout: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#F87171",
    fontSize: 16,
    fontWeight: "700",
  },
});
