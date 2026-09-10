import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "https://api.tiked.co/api";

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
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Interceptor para agregar tokens a las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const idToken = await AsyncStorage.getItem("idToken");

      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
      if (idToken) {
        config.headers["IdToken"] = idToken;
      }
    } catch (error) {
      console.error("Error al obtener tokens:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores y refresh tokens
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

    // Si el refresh falla también -> limpiar sesión completa
    if (status === 401 && originalRequest?._retry) {
      console.warn("❌ Refresh token inválido o expirado, cerrando sesión...");
      await handleLogout();
      return Promise.reject(error);
    }

    // Si es la primera vez que da 401, intentar refresh
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        // Si no hay refresh token → logout directo
        if (!refreshToken) {
          console.warn("⚠️ No hay refreshToken disponible, cerrando sesión...");
          await handleLogout();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // Esperar a que termine el refresh actual
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
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
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

          // Actualizar tokens en AsyncStorage
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
    // Avisar al backend (si está disponible)
    await api.post("/auth/logout").catch(() => {});
  } finally {
    console.warn("🧹 Limpiando sesión local...");
    // Limpiar AsyncStorage
    await AsyncStorage.multiRemove([
      "accessToken",
      "refreshToken",
      "idToken",
    ]);
  }
};

export default api;

