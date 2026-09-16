import api from "@/lib/api";
import { API_HOST_LABELS, getApiEnvironment } from "@/lib/api-env";
import { saveAuthData, type User } from "@/lib/storage";
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";

export type OrganizerLoginResult =
  | { ok: true; pending: boolean; name?: string }
  | { ok: false; message: string };

type ApiResult = { ok: true } | { ok: false; message: string };

function readJwtStatus(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const json = JSON.parse(atob(padded)) as Record<string, unknown>;
    const status = json["custom:status"];
    return typeof status === "string" ? status : null;
  } catch {
    return null;
  }
}

export function apiErrorMessage(
  error: unknown,
  fallback = "No se pudo completar la solicitud."
): string {
  if (axios.isAxiosError(error) && !error.response) {
    const host = API_HOST_LABELS[getApiEnvironment()];
    return `No se pudo conectar con ${host}. Revisa tu conexión o cambia el entorno.`;
  }
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function mimeFromUri(uri: string): string {
  const ext = uri.split("?")[0]?.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

function mapOrganizerUser(user: {
  name?: string;
  email?: string;
  id?: number;
  organizerId?: string;
  picture?: string;
  urlPay?: string;
} | undefined): User {
  return {
    name: user?.name?.trim() || "Organizador",
    email: user?.email?.trim() || "",
    id: Number(user?.id) || 0,
    userId: String(user?.organizerId ?? user?.id ?? ""),
    dni: "",
    phone: user?.urlPay ?? "",
    imageUrl: user?.picture,
  };
}

export async function loginOrganizer(
  email: string,
  password: string
): Promise<OrganizerLoginResult> {
  try {
    const response = await api.post("/organizers/auth/login", {
      email: email.trim(),
      password,
    });
    const data = response.data as {
      accessToken?: string;
      idToken?: string;
      refreshToken?: string;
      expiresIn?: number;
      user?: {
        name?: string;
        email?: string;
        id?: number;
        organizerId?: string;
        picture?: string;
        urlPay?: string;
      };
    };
    if (!data?.accessToken || !data.idToken || !data.refreshToken) {
      return { ok: false, message: "Respuesta inválida del servidor." };
    }
    const status = readJwtStatus(data.idToken);
    if (status === "PENDING") {
      return { ok: true, pending: true, name: data.user?.name };
    }
    await saveAuthData(
      {
        user: mapOrganizerUser(data.user),
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn || 3600,
      },
      "organizer"
    );
    return { ok: true, pending: false, name: data.user?.name };
  } catch (error) {
    return {
      ok: false,
      message: apiErrorMessage(
        error,
        "No se pudo iniciar sesión. Revisa tu correo y contraseña."
      ),
    };
  }
}

export async function requestOrganizerPasswordReset(
  email: string
): Promise<{ ok: boolean; message: string }> {
  try {
    await api.post(
      `/organizers/auth/password/forgot?email=${encodeURIComponent(email.trim())}`
    );
    return {
      ok: true,
      message:
        "Te enviamos un código a tu correo para restablecer la contraseña.",
    };
  } catch (error) {
    return { ok: false, message: apiErrorMessage(error) };
  }
}

export async function signupOrganizer(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  photoUri?: string | null;
}): Promise<ApiResult> {
  try {
    const payload = {
      name: input.name.trim(),
      urlPay: input.phone.trim(),
      email: input.email.trim(),
      password: input.password,
      termsAcceptedAt: new Date().toISOString(),
    };

    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      return { ok: false, message: "No se pudo preparar el registro." };
    }

    const jsonPath = `${cacheDir}organizer-signup.json`;
    await FileSystem.writeAsStringAsync(jsonPath, JSON.stringify(payload));

    const form = new FormData();
    form.append("organizer", {
      uri: jsonPath,
      name: "organizer.json",
      type: "application/json",
    } as unknown as Blob);

    if (input.photoUri) {
      const name = input.photoUri.split("/").pop()?.split("?")[0] || "logo.jpg";
      form.append("photo", {
        uri: input.photoUri,
        name,
        type: mimeFromUri(input.photoUri),
      } as unknown as Blob);
    }

    await api.post("/organizers/auth/signup", form, {
      transformRequest: (data) => data,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: apiErrorMessage(error) };
  }
}

export async function confirmOrganizerEmail(
  email: string,
  code: string
): Promise<ApiResult> {
  try {
    await api.post(
      `/organizers/auth/confirm-email?email=${encodeURIComponent(email.trim())}&code=${encodeURIComponent(code.trim())}`
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, message: apiErrorMessage(error) };
  }
}

export async function resendOrganizerConfirmation(
  email: string
): Promise<ApiResult> {
  try {
    await api.post(
      `/organizers/auth/resend-confirmation-code?email=${encodeURIComponent(email.trim())}`
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, message: apiErrorMessage(error) };
  }
}
