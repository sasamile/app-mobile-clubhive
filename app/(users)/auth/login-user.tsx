import { handleAppleLogin, isAppleAuthAvailable } from "@/lib/auth/apple";
import { handleGoogleLogin } from "@/lib/auth/google";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND = "#7C4DFF";

const TERMS_URL = "https://tiked.co/terms-and-conditions";
const PRIVACY_URL = "https://tiked.co/privacy-policy";

type AuthProvider = "apple" | "google" | null;

const LoginUser = () => {
  const { width, height } = useWindowDimensions();
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const kenBurns = useSharedValue(1);
  const lights = useSharedValue(0.35);
  const intro = useSharedValue(0);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  useEffect(() => {
    kenBurns.value = withRepeat(
      withTiming(1.1, {
        duration: 18000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
    lights.value = withRepeat(
      withTiming(0.85, {
        duration: 2400,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    intro.value = withDelay(180, withTiming(1, { duration: 700 }));
  }, [intro, kenBurns, lights]);

  const imageMotion = useAnimatedStyle(() => ({
    transform: [{ scale: kenBurns.value }],
  }));

  const clubLights = useAnimatedStyle(() => ({
    opacity: lights.value,
  }));

  const contentMotion = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [{ translateY: (1 - intro.value) * 12 }],
  }));

  const busy = loadingProvider !== null;

  const handleBack = () => {
    router.back();
  };

  const openLegalLink = (url: string) => {
    void WebBrowser.openBrowserAsync(url);
  };

  const finishLogin = (success: boolean, error?: string, cancelled?: boolean) => {
    if (cancelled) return;
    if (success) {
      router.replace("/(users)/(tabs)");
      return;
    }
    Alert.alert(
      "Error de autenticación",
      error || "No se pudo completar el inicio de sesión",
      [{ text: "OK" }]
    );
  };

  const handleAppleLoginPress = async () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoadingProvider("apple");
      const result = await handleAppleLogin();
      finishLogin(result.success, result.error, result.cancelled);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Ocurrió un error inesperado", [
        { text: "OK" },
      ]);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleLoginPress = async () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoadingProvider("google");
      const result = await handleGoogleLogin();
      finishLogin(result.success, result.error, result.cancelled);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Ocurrió un error inesperado", [
        { text: "OK" },
      ]);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Animated.View
        style={[
          styles.imageWrap,
          { width, height },
          imageMotion,
        ]}
      >
        <Image
          source={require("@/assets/img/login.png")}
          style={{ width, height }}
          contentFit="cover"
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.lights, clubLights]}
      >
        <LinearGradient
          colors={["transparent", "rgba(124,77,255,0.22)", "rgba(124,77,255,0.08)"]}
          start={{ x: 0.15, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0.55)", "transparent"]}
        locations={[0, 1]}
        style={[styles.topFade, { width, height: height * 0.32 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(0,0,0,0.78)"]}
        style={[styles.bottomFade, { width, height: height * 0.34 }]}
      />

      <SafeAreaView style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Animated.View style={[styles.textContainer, contentMotion]}>
          <Text style={styles.title}>Inicio de Sesión</Text>
          <Text style={styles.description}>
            Descubre y disfruta de los mejores eventos de tu ciudad.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.authButtons, contentMotion]}>
          {appleAvailable ? (
            <TouchableOpacity
              style={[styles.appleButton, busy && styles.buttonDisabled]}
              onPress={handleAppleLoginPress}
              activeOpacity={0.85}
              disabled={busy}
            >
              <View style={styles.buttonContent}>
                {loadingProvider === "apple" ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                )}
                <Text style={styles.appleButtonText}>
                  {loadingProvider === "apple"
                    ? "Iniciando sesión..."
                    : "Continuar con Apple"}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.googleButton, busy && styles.buttonDisabled]}
            onPress={handleGoogleLoginPress}
            activeOpacity={0.85}
            disabled={busy}
          >
            <View style={styles.buttonContent}>
              {loadingProvider === "google" ? (
                <ActivityIndicator color="#0E0E0F" size="small" />
              ) : (
                <Image
                  source={require("@/assets/logos/google.png")}
                  style={styles.googleIcon}
                  contentFit="contain"
                />
              )}
              <Text style={styles.googleButtonText}>
                {loadingProvider === "google"
                  ? "Iniciando sesión..."
                  : "Continuar con Google"}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            Al continuar aceptas nuestros{" "}
            <Text
              style={styles.legalLink}
              onPress={() => openLegalLink(TERMS_URL)}
            >
              Términos y Condiciones
            </Text>{" "}
            y{" "}
            <Text
              style={styles.legalLink}
              onPress={() => openLegalLink(PRIVACY_URL)}
            >
              Políticas de Privacidad
            </Text>
            .
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  imageWrap: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  lights: {
    ...StyleSheet.absoluteFillObject,
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 28,
    justifyContent: "space-between",
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginTop: 8,
  },
  textContainer: {
    marginTop: 40,
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 18,
    fontWeight: "500",
    paddingRight: 10,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 24,
  },
  authButtons: {
    gap: 12,
    marginBottom: 12,
  },
  appleButton: {
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 24,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  appleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButtonText: {
    color: "#0E0E0F",
    fontSize: 16,
    fontWeight: "600",
  },
  legalText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
  },
  legalLink: {
    color: "rgba(255,255,255,0.92)",
    textDecorationLine: "underline",
  },
});

export default LoginUser;
