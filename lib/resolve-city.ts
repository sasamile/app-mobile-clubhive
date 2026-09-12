import api from "@/lib/api";
import { normalizePlaceName } from "@/lib/colombia-departments";
import {
  CITIES_FRESH_MS,
  getCachedCities,
  saveCachedCities,
} from "@/lib/local-cache";
import { saveSelectedCity, type SelectedCity } from "@/lib/storage";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Linking } from "react-native";

export type CatalogCity = {
  id: number;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type LocationCityResult =
  | { ok: true; city: SelectedCity }
  | { ok: false; reason: "unavailable" | "denied" | "not_found" };

type LocationModule = typeof import("expo-location");

function getLocationModule(): LocationModule | null {
  if (!requireOptionalNativeModule("ExpoLocation")) return null;
  try {
    return require("expo-location") as LocationModule;
  } catch {
    return null;
  }
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export async function fetchCatalogCities(): Promise<CatalogCity[]> {
  const cached = await getCachedCities<CatalogCity>();
  if (cached?.data?.length) {
    if (Date.now() - cached.updatedAt >= CITIES_FRESH_MS) {
      void refreshCatalogCities().catch(() => {});
    }
    return cached.data;
  }

  try {
    return await refreshCatalogCities();
  } catch (error) {
    if (cached?.data?.length) return cached.data;
    throw error;
  }
}

async function refreshCatalogCities(): Promise<CatalogCity[]> {
  const response = await api.get("/events/cities");
  const cities: CatalogCity[] = Array.isArray(response.data) ? response.data : [];
  await saveCachedCities(cities);
  return cities;
}

function matchByName(
  cities: CatalogCity[],
  ...candidates: Array<string | null | undefined>
): CatalogCity | null {
  const needles = candidates
    .map((value) => (value ? normalizePlaceName(value) : ""))
    .filter(Boolean);

  for (const needle of needles) {
    const exact = cities.find((city) => normalizePlaceName(city.name) === needle);
    if (exact) return exact;
  }

  for (const needle of needles) {
    const partial = cities.find((city) => {
      const name = normalizePlaceName(city.name);
      return name.includes(needle) || needle.includes(name);
    });
    if (partial) return partial;
  }

  return null;
}

function matchByDistance(
  cities: CatalogCity[],
  lat: number,
  lon: number
): CatalogCity | null {
  let best: CatalogCity | null = null;
  let bestKm = Infinity;

  for (const city of cities) {
    const cityLat = Number(city.latitude);
    const cityLon = Number(city.longitude);
    if (!Number.isFinite(cityLat) || !Number.isFinite(cityLon)) continue;
    const km = haversineKm(lat, lon, cityLat, cityLon);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }

  return best && bestKm <= 80 ? best : null;
}

export async function openLocationSettings() {
  await Linking.openSettings();
}

export async function resolveCityFromLocation(): Promise<LocationCityResult> {
  const Location = getLocationModule();
  if (!Location) return { ok: false, reason: "unavailable" };

  const current = await Location.getForegroundPermissionsAsync();
  let granted = current.status === "granted";

  if (!granted) {
    if (current.canAskAgain === false) {
      return { ok: false, reason: "denied" };
    }
    const requested = await Location.requestForegroundPermissionsAsync();
    granted = requested.status === "granted";
    if (!granted) return { ok: false, reason: "denied" };
  }

  const [cities, position] = await Promise.all([
    fetchCatalogCities(),
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
  ]);

  if (cities.length === 0) return { ok: false, reason: "not_found" };

  const { latitude, longitude } = position.coords;

  let byName: CatalogCity | null = null;
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];
    byName = matchByName(
      cities,
      place?.city,
      place?.district,
      place?.subregion,
      place?.name
    );
  } catch {
    byName = null;
  }

  const matched = byName ?? matchByDistance(cities, latitude, longitude);
  if (!matched) return { ok: false, reason: "not_found" };

  const city = { id: Number(matched.id), name: matched.name };
  await saveSelectedCity(city);
  return { ok: true, city };
}
