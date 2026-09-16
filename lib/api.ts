import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosHeaders } from "axios";
import { getApiBaseUrlAsync } from "@/lib/api-env";

/** El API Tiked envuelve el body en { success, data, message }. */
function unwrapApiSuccessPayload<T = unknown>(data: unknown): T {
  if (!data || typeof data !== "object") return data as T;
  const envelope = data as Record<string, unknown>;
  if (envelope.success === true && "data" in envelope) {
    return envelope.data as T;
  }
  return data as T;
}

const api = axios.create({
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  async (config) => {
    config.baseURL = await getApiBaseUrlAsync();

    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;
    if (isFormData) {
      const headers = AxiosHeaders.from(config.headers ?? {});
      headers.delete("Content-Type");
      config.headers = headers;
    } else {
      const headers = AxiosHeaders.from(config.headers ?? {});
      if (!headers.get("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      config.headers = headers;
    }

    const path = String(config.url ?? "");
    const isPublicOrganizerAuth = path.includes("/organizers/auth/");

    if (!isPublicOrganizerAuth) {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const idToken = await AsyncStorage.getItem("idToken");
        const headers = AxiosHeaders.from(config.headers ?? {});

        if (accessToken) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
        if (idToken) {
          headers.set("IdToken", idToken);
        }
        config.headers = headers;
      } catch (error) {
        console.error("Error al obtener tokens:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    response.data = unwrapApiSuccessPayload(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest?._retry) {
      console.warn("❌ Refresh token inválido o expirado, cerrando sesión...");
      await handleLogout();
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        if (!refreshToken) {
          console.warn("⚠️ No hay refreshToken disponible, cerrando sesión...");
          await handleLogout();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;

        try {
          console.log("♻️ Refrescando token...");
          const idToken = await AsyncStorage.getItem("idToken");
          const baseURL = await getApiBaseUrlAsync();
          const response = await axios.post(
            `${baseURL}/auth/refresh`,
            {
              refreshToken,
              ...(idToken ? { idToken } : {}),
            },
            { headers: { "Content-Type": "application/json" } }
          );

          const { accessToken: newAccessToken, idToken: newIdToken } =
            unwrapApiSuccessPayload<{
              accessToken?: string;
              idToken?: string;
            }>(response.data);

          if (!newAccessToken) throw new Error("Refresh falló sin token nuevo");

          await AsyncStorage.setItem("accessToken", newAccessToken);
          if (newIdToken) {
            await AsyncStorage.setItem("idToken", newIdToken);
          }

          processQueue(null, newAccessToken);
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          await handleLogout();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } catch (err) {
        await handleLogout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

const handleLogout = async () => {
  try {
    await api.post("/auth/logout").catch(() => {});
  } finally {
    console.warn("🧹 Limpiando sesión local...");
    await AsyncStorage.multiRemove([
      "accessToken",
      "refreshToken",
      "idToken",
    ]);
  }
};

export default api;
