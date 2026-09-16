import {
  ORG_ACCENT,
  ORG_BG,
  ORG_FIELD,
  ORG_MUTED,
  OrgBack,
  OrgPrimary,
} from "@/components/organizer/auth-chrome";
import {
  confirmOrganizerEmail,
  resendOrganizerConfirmation,
} from "@/lib/auth/organizer";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ConfirmOrganizerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? "").trim();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const handleConfirm = async () => {
    if (!email) {
      Alert.alert("Correo", "Falta el correo de la cuenta.");
      return;
    }
    if (code.trim().length < 4) {
      Alert.alert("Código", "Escribe el código que te enviamos al correo.");
      return;
    }
    setBusy(true);
    const result = await confirmOrganizerEmail(email, code);
    setBusy(false);
    if (!result.ok) {
      Alert.alert("No se pudo confirmar", result.message);
      return;
    }
    Alert.alert(
      "Correo confirmado",
      "Ya puedes iniciar sesión con tu cuenta de organizador.",
      [
        {
          text: "Iniciar sesión",
          onPress: () => router.replace("/(users)/auth/login-organizer"),
        },
      ]
    );
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const result = await resendOrganizerConfirmation(email);
    setResending(false);
    Alert.alert(
      result.ok ? "Código reenviado" : "No se pudo reenviar",
      result.ok
        ? "Revisa tu correo. Puede tardar unos segundos."
        : result.message
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topRow}>
          <OrgBack onPress={() => router.back()} />
        </View>

        <Text style={styles.title}>Hemos enviado un código a tu correo</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
        <Text style={styles.subtitle}>
          Escríbelo para confirmar tu cuenta de organizador.
        </Text>

        <TextInput
          value={code}
          onChangeText={(value) =>
            setCode(value.replace(/\s/g, "").slice(0, 8))
          }
          placeholder="000000"
          placeholderTextColor="#6B6B6B"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoFocus
          style={styles.code}
        />

        <OrgPrimary
          title="Confirmar"
          onPress={() => void handleConfirm()}
          busy={busy}
          disabled={code.trim().length < 4}
        />

        <Pressable
          onPress={() => void handleResend()}
          disabled={resending}
          style={styles.resend}
        >
          <Text style={styles.resendText}>
            {resending ? "Reenviando…" : "Reenviar código"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ORG_BG,
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  email: {
    marginTop: 10,
    textAlign: "center",
    color: ORG_ACCENT,
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 15,
    lineHeight: 22,
    color: ORG_MUTED,
    textAlign: "center",
  },
  code: {
    height: 64,
    borderRadius: 16,
    backgroundColor: ORG_FIELD,
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 24,
  },
  resend: {
    marginTop: 20,
    alignItems: "center",
  },
  resendText: {
    color: ORG_ACCENT,
    fontSize: 14,
    fontWeight: "700",
  },
});
