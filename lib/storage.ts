import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SelectedCity {
  id: number;
  name: string;
}

export interface User {
  name: string;
  email: string;
  id: number;
  userId: string;
  dni: string;
  phone: string;
  imageUrl?: string;
}

export interface AuthData {
  user: User;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type SessionRole = "customer" | "organizer";

const SELECTED_CITY_KEY = "selectedCity";
const USER_DATA_KEY = "userData";
const AUTH_DATA_KEY = "authData";
const SESSION_ROLE_KEY = "sessionRole";

/**
 * Guarda la ciudad seleccionada en AsyncStorage
 */
export const saveSelectedCity = async (city: SelectedCity): Promise<void> => {
  try {
    await AsyncStorage.setItem(SELECTED_CITY_KEY, JSON.stringify(city));
    console.log('✅ Ciudad guardada:', city.name);
  } catch (error) {
    console.error('Error al guardar la ciudad:', error);
    throw error;
  }
};

/**
 * Obtiene la ciudad seleccionada de AsyncStorage
 */
export const getSelectedCity = async (): Promise<SelectedCity | null> => {
  try {
    const cityData = await AsyncStorage.getItem(SELECTED_CITY_KEY);
    if (cityData) {
      return JSON.parse(cityData) as SelectedCity;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener la ciudad:', error);
    return null;
  }
};

/**
 * Elimina la ciudad seleccionada de AsyncStorage
 */
export const removeSelectedCity = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SELECTED_CITY_KEY);
  } catch (error) {
    console.error('Error al eliminar la ciudad:', error);
    throw error;
  }
};

/**
 * Guarda la información completa del usuario y autenticación
 */
export const saveAuthData = async (
  authData: AuthData,
  role: SessionRole = "customer"
): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [AUTH_DATA_KEY, JSON.stringify(authData)],
      [USER_DATA_KEY, JSON.stringify(authData.user)],
      ["accessToken", authData.accessToken],
      ["idToken", authData.idToken],
      ["refreshToken", authData.refreshToken],
      [SESSION_ROLE_KEY, role],
    ]);
  } catch (error) {
    console.error("Error al guardar información de autenticación:", error);
    throw error;
  }
};

export const getSessionRole = async (): Promise<SessionRole | null> => {
  try {
    const role = await AsyncStorage.getItem(SESSION_ROLE_KEY);
    if (role === "organizer" || role === "customer") return role;
    return null;
  } catch {
    return null;
  }
};

export const getHomeRoute = async (): Promise<
  "/(organizer)/(tabs)" | "/(users)/(tabs)" | "/welcome"
> => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) return "/welcome";
    const role = await getSessionRole();
    if (role === "organizer") return "/(organizer)/(tabs)";
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userData) return "/(users)/(tabs)";
    return "/welcome";
  } catch {
    return "/welcome";
  }
};

/**
 * Obtiene la información del usuario guardada
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userData) {
      return JSON.parse(userData) as User;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return null;
  }
};

export const saveUserData = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    const rawAuth = await AsyncStorage.getItem(AUTH_DATA_KEY);
    if (!rawAuth) return;
    const auth = JSON.parse(rawAuth) as AuthData;
    await AsyncStorage.setItem(
      AUTH_DATA_KEY,
      JSON.stringify({ ...auth, user })
    );
  } catch (error) {
    console.error('Error al guardar información del usuario:', error);
    throw error;
  }
};

/**
 * Obtiene toda la información de autenticación
 */
export const getAuthData = async (): Promise<AuthData | null> => {
  try {
    const authData = await AsyncStorage.getItem(AUTH_DATA_KEY);
    if (authData) {
      return JSON.parse(authData) as AuthData;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener información de autenticación:', error);
    return null;
  }
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return !!(accessToken && userData);
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    return false;
  }
};

/**
 * Limpia toda la información de autenticación
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      AUTH_DATA_KEY,
      USER_DATA_KEY,
      SESSION_ROLE_KEY,
      "accessToken",
      "refreshToken",
      "idToken",
    ]);
  } catch (error) {
    console.error('Error al limpiar información de autenticación:', error);
    throw error;
  }
};

