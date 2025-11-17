import { handleGoogleLogin, useGoogleAuth } from "@/lib/auth/google";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const LoginUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { request, promptAsync, redirectUri } = useGoogleAuth();

  const handleBack = () => {
    router.back();
  };

  const handleGoogleLoginPress = async () => {
    if (!request || !promptAsync || !redirectUri) {
      Alert.alert("Error", "La autenticación no está lista. Intenta de nuevo.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await handleGoogleLogin(promptAsync, request, redirectUri);

      if (result.success) {
        // Navegar a la pantalla principal después del login exitoso
        router.push("/(users)/city");
      } else {
        Alert.alert(
          "Error de autenticación",
          result.error || "No se pudo completar el inicio de sesión",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Error en handleGoogleLoginPress:", error);
      Alert.alert("Error", error?.message || "Ocurrió un error inesperado", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Imagen de fondo que cubre toda la pantalla */}
      <Image
        source={require("@/assets/img/login.png")}
        style={[
          styles.backgroundImage,
          { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
        ]}
        contentFit="cover"
      />

      {/* Degradado oscuro sobre la imagen */}
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
        style={[
          styles.gradient,
          { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
        ]}
      />

      {/* Contenido con SafeAreaView */}
      <SafeAreaView style={styles.content}>
        {/* Botón de regreso */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Título y descripción */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Inicio de Sesión</Text>
          <Text style={styles.description}>
            Descubre y disfruta de los mejores eventos de tu ciudad.
          </Text>
        </View>

        {/* Botón de Google */}
        <TouchableOpacity
          style={[
            styles.googleButton,
            isLoading && styles.googleButtonDisabled,
          ]}
          onPress={handleGoogleLoginPress}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <View style={styles.googleButtonContent}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Image
                source={require("@/assets/logos/google.png")}
                style={styles.googleIcon}
                contentFit="contain"
              />
            )}
            <Text style={styles.googleButtonText}>
              {isLoading ? "Iniciando sesión..." : "Continuar con Google"}
            </Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  },
  description: {
    fontSize: 18,
    fontWeight: "500",
    paddingRight: 10,
    color: "#FFFFFF",
    lineHeight: 24,
    opacity: 0.9,
  },
  googleButton: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LoginUser;
