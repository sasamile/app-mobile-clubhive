import { SocialLoginRequest, SocialLoginResponse } from "@/types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import api from "../api";

export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export const handleAppleLogin = async (): Promise<{
  success: boolean;
  error?: string;
  cancelled?: boolean;
}> => {
  try {
    const available = await isAppleAuthAvailable();
    if (!available) {
      return {
        success: false,
        error: "Iniciar sesión con Apple no está disponible en este dispositivo",
      };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const identityToken = credential.identityToken;
    if (!identityToken) {
      return {
        success: false,
        error: "Apple no devolvió el token de identidad",
      };
    }

    // Apple entrega el nombre una sola vez, en el primer inicio de sesion de este Apple ID
    // con la app. En los siguientes viene vacio, y el identityToken nunca lo incluye, asi que
    // hay que reenviarlo aqui para que el backend pueda crear la cuenta.
    const fullName = [
      credential.fullName?.givenName,
      credential.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const payload: SocialLoginRequest = {
      socialToken: identityToken,
      authType: "APPLE",
      termsAccepted: true,
      ...(fullName ? { fullName } : {}),
    };

    const { data } = await api.post<SocialLoginResponse>(
      "/customers/auth/socialLogin",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (data.accessToken) {
      await AsyncStorage.setItem("accessToken", data.accessToken);
    }
    if (data.refreshToken) {
      await AsyncStorage.setItem("refreshToken", data.refreshToken);
    }
    if (data.idToken) {
      await AsyncStorage.setItem("idToken", data.idToken);
    }

    if (data.user && data.accessToken && data.idToken && data.refreshToken) {
      const { saveAuthData } = await import("../storage");
      await saveAuthData({
        user: data.user as any,
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn || 3600,
      });
    }

    return { success: true };
  } catch (error: any) {
    if (error?.code === "ERR_REQUEST_CANCELED") {
      return { success: false, cancelled: true };
    }

    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Error desconocido en la autenticación";

    return {
      success: false,
      error: errorMessage,
    };
  }
};
