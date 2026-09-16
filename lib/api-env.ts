import AsyncStorage from "@react-native-async-storage/async-storage";

export type ApiEnvironment = "prod" | "dev";

export const API_BASE_URLS: Record<ApiEnvironment, string> = {
  prod: "https://api.tiked.co/api",
  dev: "https://dev.tiked.co/api",
};

export const API_HOST_LABELS: Record<ApiEnvironment, string> = {
  prod: "api.tiked.co",
  dev: "dev.tiked.co",
};

export const API_ENV_LABELS: Record<ApiEnvironment, string> = {
  prod: "Producción",
  dev: "Desarrollo",
};

export const ORGANIZER_PANEL_URLS: Record<ApiEnvironment, string> = {
  prod: "https://tiked.co/organizer/dashboard",
  dev: "https://dev.tiked.co/organizer/dashboard",
};

export function getOrganizerPanelUrl(): string {
  return ORGANIZER_PANEL_URLS[currentEnv];
}

const STORAGE_KEY = "tiked.apiEnv";

let loaded = false;
let currentEnv: ApiEnvironment = "prod";
const listeners = new Set<(env: ApiEnvironment) => void>();

function notify() {
  listeners.forEach((listener) => listener(currentEnv));
}

export function subscribeApiEnvironment(
  listener: (env: ApiEnvironment) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getApiEnvironment(): ApiEnvironment {
  return currentEnv;
}

export function getApiBaseUrl(): string {
  return API_BASE_URLS[currentEnv];
}

export async function loadApiEnvironment(): Promise<ApiEnvironment> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "dev" || stored === "prod") {
      currentEnv = stored;
    }
  } catch {
    currentEnv = "prod";
  } finally {
    loaded = true;
    notify();
  }
  return currentEnv;
}

export async function getApiBaseUrlAsync(): Promise<string> {
  if (!loaded) await loadApiEnvironment();
  return getApiBaseUrl();
}

export async function setApiEnvironment(
  env: ApiEnvironment
): Promise<ApiEnvironment> {
  currentEnv = env;
  loaded = true;
  await AsyncStorage.setItem(STORAGE_KEY, env);
  notify();
  return env;
}

void loadApiEnvironment();
