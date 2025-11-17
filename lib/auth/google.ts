// lib/auth/google.ts
import { SocialLoginRequest, SocialLoginResponse } from "@/types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import api from "../api";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

const GOOGLE_CLIENT_ID =
  "926578021265-5u58ai7iit26e8fbisrpfverklf7gnf7.apps.googleusercontent.com";

// Solo para saber si es Expo Go
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Scheme nativo que te da Google en el client iOS
const GOOGLE_IOS_SCHEME =
  "com.googleusercontent.apps.926578021265-5u58ai7iit26e8fbisrpfverklf7gnf7";



export const useGoogleAuth = () => {
  // redirect para:
  // - Expo Go: lo genera solo (https://auth.expo.io/...)
  // - Dev build / producción iOS: el redirect nativo de Google: com.googleusercontent.apps.X:/oauthredirect
  const redirectUri = isExpoGo
    ? AuthSession.makeRedirectUri()
    : AuthSession.makeRedirectUri({
        native: `${GOOGLE_IOS_SCHEME}:/oauthredirect`,
      });



  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      // ⬇⬇ CAMBIO IMPORTANTE
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      redirectUri,
    },
    discovery
  );


  // devolvemos también redirectUri y request porque los necesitamos
  return { request, response, promptAsync, redirectUri };
};

export const handleGoogleLogin = async (
  promptAsync: () => Promise<AuthSession.AuthSessionResult>,
  request: AuthSession.AuthRequest | null,
  redirectUri: string
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    if (!request) {
      return {
        success: false,
        error: "La solicitud de autenticación no está lista",
      };
    }

    // 1️⃣ Lanzar el flujo
    const result = await promptAsync();
    console.log("🔐 Resultado de Google Auth:", result.type);

    if (result.type !== "success") {
      if (result.type === "cancel") {
        return {
          success: false,
          error: "El usuario canceló la autenticación",
        };
      }
      return {
        success: false,
        error: `Error en la autenticación: ${result.type}`,
      };
    }

    const params = (result as any).params || {};

    const code = params.code;
    if (!code) {
      console.error("❌ No se recibió el código de autorización");
      return {
        success: false,
        error: "No se recibió el código de autorización de Google",
      };
    }

    // 2️⃣ Intercambiar el `code` por tokens (access_token + id_token, etc.)
    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId: GOOGLE_CLIENT_ID,
        code,
        redirectUri,
        // PKCE: importantísimo mandar el code_verifier que generó la request
        extraParams: {
          code_verifier: request.codeVerifier || "",
        },
      },
      discovery
    );

    const id_token = tokenResult.idToken;

    if (!id_token) {
      console.error("❌ Google no devolvió id_token");
      return {
        success: false,
        error:
          "Google no devolvió el id_token. Revisa que tengas el scope 'openid' configurado.",
      };
    }

    // 3️⃣ Enviar el id_token a tu backend como antes (igual que en web)
    // Asegurarse de que el token no sea null o undefined
    if (!id_token || id_token.trim() === "") {
      console.error("❌ El id_token está vacío o es null");
      return {
        success: false,
        error: "El token de Google está vacío",
      };
    }


    const payload: SocialLoginRequest = {
      socialToken: id_token,
      authType: "GOOGLE",
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

    // 4️⃣ Guardar tokens en AsyncStorage
    if (data.accessToken) {
      await AsyncStorage.setItem("accessToken", data.accessToken);
    }
    if (data.refreshToken) {
      await AsyncStorage.setItem("refreshToken", data.refreshToken);
    }
    if (data.idToken) {
      await AsyncStorage.setItem("idToken", data.idToken);
    }

    // 5️⃣ Guardar información completa del usuario
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

    console.log("✅ Login exitoso");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error en handleGoogleLogin:", error);
    console.error("📋 Detalles del error:", {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      url: error?.config?.url,
    });
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
