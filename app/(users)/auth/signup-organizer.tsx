import {
  ORG_ACCENT,
  ORG_BG,
  ORG_FIELD,
  ORG_MUTED,
  OrgBack,
  OrgField,
  OrgPrimary,
  OrgProgress,
} from "@/components/organizer/auth-chrome";
import { signupOrganizer } from "@/lib/auth/organizer";
import { pickLocalImage } from "@/lib/pick-profile-photo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActionSheetIOS,
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

const TERMS_URL = "https://tiked.co/organizer/terms";
const PRIVACY_URL = "https://tiked.co/organizer/privacy";

const COUNTRIES = [
  { iso: "CO", dial: "+57", flag: "🇨🇴" },
  { iso: "MX", dial: "+52", flag: "🇲🇽" },
  { iso: "US", dial: "+1", flag: "🇺🇸" },
  { iso: "AR", dial: "+54", flag: "🇦🇷" },
  { iso: "CL", dial: "+56", flag: "🇨🇱" },
  { iso: "PE", dial: "+51", flag: "🇵🇪" },
  { iso: "EC", dial: "+593", flag: "🇪🇨" },
] as const;

export default function SignupOrganizerScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>(
    COUNTRIES[0]
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);

  const passwordsMatch = Boolean(password) && password === confirm;
  const passwordsMismatch = Boolean(confirm) && password !== confirm;

  const pickCountry = () => {
    const labels = COUNTRIES.map((item) => `${item.flag}  ${item.dial}`);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Indicativo",
          options: ["Cancelar", ...labels],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (!index || index <= 0) return;
          const next = COUNTRIES[index - 1];
          if (next) setCountry(next);
        }
      );
      return;
    }
    Alert.alert("Indicativo", undefined, [
      ...COUNTRIES.map((item) => ({
        text: `${item.flag} ${item.dial}`,
        onPress: () => setCountry(item),
      })),
      { text: "Cancelar", style: "cancel" as const },
    ]);
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }
    router.back();
  };

  const handleStep1 = () => {
    if (!name.trim()) {
      Alert.alert("Empresa", "Escribe el nombre de la empresa.");
      return;
    }
    setStep(2);
  };

  const handleFinish = async () => {
    const digits = phoneLocal.replace(/\D/g, "");
    if (!email.trim().includes("@")) {
      Alert.alert("Email", "Escribe un correo válido.");
      return;
    }
    if (digits.length < 7 || digits.length > 15) {
      Alert.alert("Teléfono", "El teléfono debe tener entre 7 y 15 dígitos.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Contraseña", "Mínimo 8 caracteres.");
      return;
    }
    if (!passwordsMatch) {
      Alert.alert("Contraseña", "Las contraseñas no coinciden.");
      return;
    }
    if (!terms) {
      Alert.alert(
        "Términos",
        "Debes aceptar los términos y la política de privacidad."
      );
      return;
    }

    setBusy(true);
    const result = await signupOrganizer({
      name,
      email,
      password,
      phone: `${country.dial}${digits}`,
      photoUri: logoUri,
    });
    setBusy(false);

    if (!result.ok) {
      Alert.alert("No se pudo crear la cuenta", result.message);
      return;
    }

    router.replace({
      pathname: "/(users)/auth/confirm-organizer",
      params: { email: email.trim() },
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <OrgBack onPress={goBack} label={step === 2 ? "Atrás" : undefined} />
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.title}>Regístrate y empieza a vender</Text>
              <Text style={styles.subtitle}>
                Solo necesitamos algunos datos para empezar a conectar tus
                eventos con el público correcto 🔥.
              </Text>

              <Text style={styles.label}>Logo de la empresa</Text>
              <Pressable
                onPress={() => {
                  void (async () => {
                    const uri = await pickLocalImage();
                    if (uri) setLogoUri(uri);
                  })();
                }}
                style={styles.dropzone}
              >
                {logoUri ? (
                  <>
                    <Image
                      source={{ uri: logoUri }}
                      style={styles.logo}
                      contentFit="contain"
                    />
                    <Pressable
                      onPress={() => setLogoUri(null)}
                      style={styles.trash}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View style={styles.uploadIcon}>
                      <Ionicons
                        name="cloud-upload-outline"
                        size={22}
                        color={ORG_ACCENT}
                      />
                    </View>
                    <Text style={styles.dropTitle}>
                      Sube tu logo o arrástralo aquí
                    </Text>
                    <Text style={styles.dropHint}>PNG, JPG o SVG (máx. 5MB)</Text>
                  </>
                )}
              </Pressable>

              <OrgField
                label="Nombre de la empresa"
                inputProps={{
                  value: name,
                  onChangeText: setName,
                  placeholder: "Nombre de la empresa",
                  autoCapitalize: "words",
                }}
              />

              <OrgPrimary title="Continuar" onPress={handleStep1} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Configura tu cuenta</Text>
              <Text style={styles.subtitle}>
                Completa los últimos detalles antes de continuar.
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

              <Text style={styles.label}>Teléfono de contacto</Text>
              <View style={styles.phoneRow}>
                <Pressable onPress={pickCountry} style={styles.dial}>
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Ionicons name="chevron-down" size={12} color={ORG_MUTED} />
                  <Text style={styles.dialText}>{country.dial}</Text>
                </Pressable>
                <TextInput
                  value={phoneLocal}
                  onChangeText={setPhoneLocal}
                  placeholder="300 123 4567"
                  placeholderTextColor="#6B6B6B"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  style={styles.phoneInput}
                />
              </View>

              <OrgField
                label="Contraseña"
                inputProps={{
                  value: password,
                  onChangeText: setPassword,
                  placeholder: "••••••••",
                  secureTextEntry: !showPassword,
                  textContentType: "newPassword",
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

              <OrgField
                label="Confirmar contraseña"
                inputProps={{
                  value: confirm,
                  onChangeText: setConfirm,
                  placeholder: "••••••••",
                  secureTextEntry: !showConfirm,
                  textContentType: "newPassword",
                }}
                trailing={
                  <View style={styles.confirmTrail}>
                    {passwordsMatch ? (
                      <Text style={styles.match}>Coinciden</Text>
                    ) : passwordsMismatch ? (
                      <Text style={styles.mismatch}>No coinciden</Text>
                    ) : null}
                    <Pressable
                      onPress={() => setShowConfirm((value) => !value)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showConfirm ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={ORG_MUTED}
                      />
                    </Pressable>
                  </View>
                }
              />

              <Pressable
                onPress={() => setTerms((value) => !value)}
                style={styles.termsRow}
              >
                <View style={[styles.checkbox, terms && styles.checkboxOn]}>
                  {terms ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text style={styles.termsText}>
                  Acepto los{" "}
                  <Text
                    style={styles.link}
                    onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL)}
                  >
                    términos y condiciones
                  </Text>{" "}
                  y la{" "}
                  <Text
                    style={styles.link}
                    onPress={() =>
                      void WebBrowser.openBrowserAsync(PRIVACY_URL)
                    }
                  >
                    política de privacidad
                  </Text>
                  .
                </Text>
              </Pressable>

              <OrgPrimary
                title="Finalizar"
                onPress={() => void handleFinish()}
                busy={busy}
                disabled={!terms || !passwordsMatch}
              />
            </>
          )}
        </ScrollView>
        <View style={{ paddingBottom: insets.bottom + 16 }}>
          <OrgProgress step={step} />
        </View>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    color: ORG_MUTED,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  dropzone: {
    minHeight: 220,
    borderRadius: 16,
    backgroundColor: ORG_FIELD,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  logo: {
    width: "80%",
    height: 160,
  },
  trash: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dropTitle: {
    color: "#C4C4C4",
    fontSize: 15,
    fontWeight: "600",
  },
  dropHint: {
    marginTop: 4,
    color: "#6B6B6B",
    fontSize: 13,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: ORG_FIELD,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  dial: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  flag: {
    fontSize: 18,
  },
  dialText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    paddingVertical: 14,
    paddingRight: 16,
  },
  confirmTrail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  match: {
    color: "#4ADE80",
    fontSize: 12,
    fontWeight: "600",
  },
  mismatch: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "600",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: ORG_ACCENT,
    borderColor: ORG_ACCENT,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: ORG_MUTED,
  },
  link: {
    color: ORG_ACCENT,
    fontWeight: "600",
  },
});
