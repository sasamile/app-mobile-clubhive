import {
  ORG_ACCENT,
  ORG_BG,
  ORG_MUTED,
  OrgBack,
  OrgField,
  OrgPrimary,
} from "@/components/organizer/auth-chrome";
import {
  loginOrganizer,
  requestOrganizerPasswordReset,
} from "@/lib/auth/organizer";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginOrganizerScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Organizador", "Escribe tu correo y contraseña.");
      return;
    }
    setBusy(true);
    const result = await loginOrganizer(email, password);
    setBusy(false);
    if (!result.ok) {
      Alert.alert("No se pudo entrar", result.message);
      return;
    }
    if (result.pending) {
      Alert.alert(
        "Estás en lista de espera",
        "Tu cuenta está en revisión. Te avisaremos para que empieces a crear eventos."
      );
      return;
    }
    router.replace("/(organizer)/(tabs)");
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      Alert.alert("Correo", "Escribe el correo de tu cuenta de organizador.");
      return;
    }
    setBusy(true);
    const result = await requestOrganizerPasswordReset(email);
    setBusy(false);
    Alert.alert(
      result.ok ? "Revisa tu correo" : "No se pudo enviar",
      result.message
    );
    if (result.ok) setMode("login");
  };

  const isForgot = mode === "forgot";

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
    }, [])
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <OrgBack onPress={() => router.back()} />
          </View>

          <View style={styles.brand}>
            <Image
              source={require("@/assets/logos/tiked.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>
            {isForgot ? "¿Olvidaste tu contraseña?" : "Iniciar sesión"}
          </Text>
          <Text style={styles.subtitle}>
            {isForgot
              ? "Escribe el correo de tu cuenta de organizador y te enviamos el código."
              : "Entra con el correo y la contraseña de tu cuenta de organizador."}
          </Text>

          <OrgField
            label="Email"
            inputProps={{
              value: email,
              onChangeText: setEmail,
              placeholder: "tu@correo.com",
              autoCapitalize: "none",
              autoCorrect: false,
              keyboardType: "email-address",
              textContentType: "emailAddress",
            }}
          />

          {isForgot ? null : (
            <>
              <OrgField
                label="Contraseña"
                inputProps={{
                  value: password,
                  onChangeText: setPassword,
                  placeholder: "••••••••",
                  secureTextEntry: !showPassword,
                  textContentType: "password",
                }}
                trailing={
                  <Pressable
                    onPress={() => setShowPassword((value) => !value)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={ORG_MUTED}
                    />
                  </Pressable>
                }
              />
              <Pressable
                onPress={() => setMode("forgot")}
                style={styles.forgotWrap}
              >
                <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </>
          )}

          <View style={styles.spacer} />

          <OrgPrimary
            title={isForgot ? "Enviar código" : "Iniciar sesión"}
            onPress={() => void (isForgot ? handleForgot() : handleLogin())}
            busy={busy}
            fullWidth
          />

          {isForgot ? (
            <Pressable onPress={() => setMode("login")} style={styles.switch}>
              <Text style={styles.switchMuted}>
                ¿La recordaste? <Text style={styles.switchAccent}>Volver</Text>
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push("/(users)/auth/signup-organizer")}
              style={styles.switch}
            >
              <Text style={styles.switchMuted}>
                ¿Aún no tienes cuenta?{" "}
                <Text style={styles.switchAccent}>Crear cuenta</Text>
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ORG_BG,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  brand: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
  },
  logo: {
    width: 208,
    height: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 15,
    lineHeight: 22,
    color: ORG_MUTED,
    textAlign: "center",
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 8,
  },
  forgot: {
    fontSize: 13,
    fontWeight: "700",
    color: ORG_ACCENT,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 28,
  },
  switch: {
    marginTop: 18,
    alignItems: "center",
  },
  switchMuted: {
    fontSize: 14,
    color: ORG_MUTED,
  },
  switchAccent: {
    color: ORG_ACCENT,
    fontWeight: "700",
  },
});
