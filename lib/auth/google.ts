// lib/auth/google.ts
//
// Login con Google usando el SDK nativo (@react-native-google-signin/google-signin).
// Requiere un build nativo (expo run:ios / expo run:android / EAS); no funciona en Expo Go.
//
// Clients de OAuth (proyecto de Google Cloud "Tiked" → tiked-493821, el mismo que usa la web):
//   - webClientId  → client tipo "Aplicación web". Es el `aud` del idToken que se
//                    envía al backend (api.tiked.co) y el mismo que usa la web.
//   - iOS          → client tipo "iOS" (bundle com.clubhive.app). Se configura UNA sola
//                    vez en app.json: ios.infoPlist.GIDClientID + el plugin
//                    @react-native-google-signin/google-signin (iosUrlScheme invertido
//                    "com.googleusercontent.apps.<id>"). Aquí se lee GIDClientID desde
//                    expoConfig para no duplicarlo.
//   - Android      → client tipo "Android" (package com.clubhive.app + SHA-1 de la firma).
//                    No se referencia en código: solo debe existir en Google Cloud.
//
// El client secret NUNCA va en la app: el SDK nativo no lo necesita y cualquiera
// podría extraerlo del binario.
import { SocialLoginRequest, SocialLoginResponse } from "@/types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import api from "../api";
import { saveAuthData } from "../storage";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const GOOGLE_WEB_CLIENT_ID =
  "1014451974721-gcpkfkr3pmknnoi26r8djq4g9r61qt03.apps.googleusercontent.com";

const GOOGLE_CLIENT_ID_SUFFIX = ".apps.googleusercontent.com";

/** Client iOS: se lee de app.json (ios.infoPlist.GIDClientID). */
const GOOGLE_IOS_CLIENT_ID: string | undefined = (() => {
  const infoPlist = Constants.expoConfig?.ios?.infoPlist as
    | Record<string, unknown>
    | undefined;
  const value = infoPlist?.GIDClientID;
  return typeof value === "string" ? value : undefined;
})();

const isValidClientId = (value: string | undefined): value is string =>
  typeof value === "string" &&
  value.endsWith(GOOGLE_CLIENT_ID_SUFFIX) &&
  !value.toLowerCase().includes("reemplazar");

/**
 * Decodifica el payload de un JWT sin verificar la firma. Solo para diagnóstico:
 * saber con qué `aud` (audiencia) viene el idToken que Google emite, porque el
 * backend valida ese claim. Nunca loguea el token completo, que es una credencial.
 */
const describeIdToken = (idToken: string): Record<string, unknown> | null => {
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const json = JSON.parse(
      decodeURIComponent(
        atob(padded)
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      )
    );
    return {
      aud: json.aud,
      azp: json.azp,
      iss: json.iss,
      email_verified: json.email_verified,
      hasEmail: Boolean(json.email),
      expiraEn: json.exp
        ? Math.round(json.exp - Date.now() / 1000) + "s"
        : undefined,
    };
  } catch {
    return null;
  }
};

export type GoogleLoginResult = {
  success: boolean;
  error?: string;
  cancelled?: boolean;
};

let configured = false;

/**
 * Configura el SDK una sola vez. Se hace de forma perezosa (y no al importar el
 * módulo) para poder devolver un error legible si falta el client iOS.
 */
const ensureConfigured = (): { ok: true } | { ok: false; error: string } => {
  if (configured) return { ok: true };

  if (Platform.OS === "ios" && !isValidClientId(GOOGLE_IOS_CLIENT_ID)) {
    return {
      ok: false,
      error:
        "Falta el client iOS de Google. Crea un client tipo iOS (bundle com.clubhive.app) en Google Cloud y pégalo con: node scripts/set-google-ios-client.mjs <client-id>",
    };
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });
  configured = true;
  return { ok: true };
};

export const handleGoogleLogin = async (): Promise<GoogleLoginResult> => {
  try {
    if (isExpoGo) {
      return {
        success: false,
        error:
          "Google no funciona en Expo Go. Abre el development build de Tiked (no Expo Go) o instálalo con: npx expo run:ios --device",
      };
    }

    const config = ensureConfigured();
    if (!config.ok) {
      return { success: false, error: config.error };
    }

    // Android: verifica (y ofrece actualizar) Google Play Services. En iOS resuelve true.
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 1️⃣ Abrir el selector de cuenta nativo de Google
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { success: false, cancelled: true };
    }

    // 2️⃣ El idToken viene firmado por Google con aud = GOOGLE_WEB_CLIENT_ID
    const idToken = response.data.idToken;
    if (!idToken || idToken.trim() === "") {
      console.error("❌ Google no devolvió id_token");
      return {
        success: false,
        error:
          "Google no devolvió el id_token. Revisa que el webClientId sea el client tipo 'Aplicación web' del proyecto.",
      };
    }

    if (__DEV__) {
      const claims = describeIdToken(idToken);
      console.log("🔎 idToken de Google:", claims);
      if (claims && claims.aud !== GOOGLE_WEB_CLIENT_ID) {
        console.warn(
          "⚠️ El `aud` del idToken NO es el client web. El backend valida ese claim, " +
            "así que va a rechazar el login. aud recibido:",
          claims.aud
        );
      }
    }

    // 3️⃣ Enviar el id_token al backend (igual que en web)
    const payload: SocialLoginRequest = {
      socialToken: idToken,
      authType: "GOOGLE",
      termsAccepted: true,
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
      await saveAuthData({
        user: data.user as any,
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn || 3600,
      });
    }

    console.log("✅ Login con Google exitoso");
    return { success: true };
  } catch (error: any) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { success: false, cancelled: true };
        case statusCodes.IN_PROGRESS:
          return {
            success: false,
            error: "Ya hay un inicio de sesión con Google en curso",
          };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            error:
              "Google Play Services no está disponible o está desactualizado en este dispositivo",
          };
      }

      // Android: DEVELOPER_ERROR (código 10) = falta el client Android con el
      // package com.clubhive.app y el SHA-1 de la firma en Google Cloud.
      if (
        String(error.code) === "10" ||
        /DEVELOPER_ERROR/i.test(String(error.message))
      ) {
        console.error("❌ Google DEVELOPER_ERROR:", error);
        return {
          success: false,
          error:
            "Configuración de Google incompleta en Android: falta el client Android (package com.clubhive.app + SHA-1) en Google Cloud.",
        };
      }
    }

    console.error("❌ Error en handleGoogleLogin:", error);
    console.error("📋 Detalles del error:", {
      code: error?.code,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      url: error?.config?.url,
    });

    const rawMessage = String(error?.message ?? "");
    if (/missing support for the following URL schemes/i.test(rawMessage)) {
      return {
        success: false,
        error:
          "Este binario de iOS no tiene el URL scheme de Google. Un reload no alcanza: reinstala la app con npx expo run:ios --device (o un development build de EAS).",
      };
    }

    if (error?.response?.status === 401) {
      return {
        success: false,
        error:
          "Google te autenticó, pero el servidor de Tiked rechazó el token. " +
          "Revisa en la consola el `aud` que aparece en '🔎 idToken de Google'.",
      };
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

/**
 * Cierra la sesión de Google en el dispositivo para que, al volver a entrar,
 * el usuario pueda elegir cuenta. Nunca lanza: el logout local no debe fallar por esto.
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    const config = ensureConfigured();
    if (!config.ok) return;
    await GoogleSignin.signOut();
  } catch (error) {
    console.warn("⚠️ No se pudo cerrar la sesión de Google:", error);
  }
};
