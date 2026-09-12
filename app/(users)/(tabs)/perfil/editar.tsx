import { ScreenAtmosphere } from "@/components/discover/screen-atmosphere";
import { Discover, FLOATING_TAB_INSET } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { getUserData, type User } from "@/lib/storage";
import { promptProfilePhoto } from "@/lib/pick-profile-photo";
import { resolveProfileImage, updateCustomerProfile } from "@/lib/user-profile";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditarPerfilScreen() {
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const saved = await getUserData();
      if (!saved) return;
      setUser(saved);
      setName(saved.name ?? "");
      setPhone(saved.phone ?? "");
      setDni(saved.dni ?? "");
      setPhoto(await resolveProfileImage(saved));
    })();
  }, []);

  const initials = (name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Perfil", "Escribe tu nombre.");
      return;
    }

    try {
      setIsSaving(true);
      const next = await updateCustomerProfile({
        name: trimmed,
        phone,
        dni,
      });
      setUser(next);
      Alert.alert("Listo", "Tu perfil quedó actualizado.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(
        "No se pudo guardar",
        "Revisa tu conexión e inténtalo de nuevo."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ title: "Editar perfil" }} />
      <StatusBar style={theme.statusBar} />
      <ScreenAtmosphere height={180} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: FLOATING_TAB_INSET + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() =>
              promptProfilePhoto((uri) => {
                if (uri) {
                  setPhoto(uri);
                  return;
                }
                void resolveProfileImage(
                  user ? { ...user, imageUrl: undefined } : null
                ).then(setPhoto);
              })
            }
            style={styles.photoWrap}
          >
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={[styles.avatar, { backgroundColor: theme.chip }]}
                contentFit="cover"
              />
            ) : (
              <View
                style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { borderColor: theme.bg }]}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={[styles.photoHint, { color: theme.muted }]}>
            Toca para cambiar tu foto. Se guarda en este dispositivo.
          </Text>

          <Text style={[styles.label, { color: theme.muted }]}>Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={theme.muted}
            autoCapitalize="words"
            style={[
              styles.input,
              {
                color: theme.ink,
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.muted }]}>Teléfono</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+57 300 000 0000"
            placeholderTextColor={theme.muted}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                color: theme.ink,
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.muted }]}>Documento</Text>
          <TextInput
            value={dni}
            onChangeText={setDni}
            placeholder="Número de documento"
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                color: theme.ink,
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
            ]}
          />

          <Pressable
            onPress={() => void handleSave()}
            disabled={isSaving}
            style={[styles.save, isSaving && styles.saveDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Guardar cambios</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Discover.pad,
    paddingTop: 8,
  },
  photoWrap: {
    alignSelf: "center",
    marginTop: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  cameraBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Discover.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  photoHint: {
    marginTop: 10,
    marginBottom: 28,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
  },
  save: {
    marginTop: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: Discover.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
