import {
  fetchEventsByCity,
  type DiscoverEvent,
} from "@/lib/discover-events";
import {
  EVENTS_FRESH_MS,
  getCachedEvents,
  getCachedSavedIds,
  getEventsMemory,
  getLastCachedEvents,
  saveCachedEvents,
  saveCachedSavedIds,
  setEventsMemory,
  subscribeEventsCache,
} from "@/lib/local-cache";
import { resolveCityFromLocation } from "@/lib/resolve-city";
import { getSelectedCity } from "@/lib/storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

let eventsInFlight: Promise<DiscoverEvent[]> | null = null;
let eventsInFlightCity: string | null = null;

async function refreshEvents(cityName: string): Promise<DiscoverEvent[]> {
  if (eventsInFlight && eventsInFlightCity === cityName) {
    return eventsInFlight;
  }
  eventsInFlightCity = cityName;
  eventsInFlight = fetchEventsByCity(cityName).finally(() => {
    eventsInFlight = null;
    eventsInFlightCity = null;
  });
  return eventsInFlight;
}

export function useDiscoverEvents() {
  const memory = getEventsMemory();
  const [events, setEvents] = useState<DiscoverEvent[]>(memory?.events ?? []);
  const [cityName, setCityName] = useState<string | null>(memory?.cityName ?? null);
  const [isLoading, setIsLoading] = useState(!memory);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    return subscribeEventsCache((snapshot) => {
      if (!snapshot) return;
      setCityName(snapshot.cityName);
      setEvents(snapshot.events);
    });
  }, []);

  const load = useCallback(async (force = false) => {
    try {
      let city = await getSelectedCity();

      if (!city) {
        const last = getEventsMemory() ?? (await getLastCachedEvents());
        if (last) {
          setEventsMemory(last);
          setIsLoading(false);
        }
        const located = await resolveCityFromLocation();
        if (located.ok) city = located.city;
      }

      if (!city) {
        if (!getEventsMemory()) {
          setCityName(null);
          setEvents([]);
        }
        return;
      }

      const cached =
        getEventsMemory()?.cityName === city.name
          ? getEventsMemory()
          : await getCachedEvents(city.name);

      if (cached) {
        setEventsMemory(cached);
        setIsLoading(false);
        if (!force && Date.now() - cached.updatedAt < EVENTS_FRESH_MS) {
          return;
        }
      } else {
        setCityName(city.name);
        setIsLoading(true);
      }

      setIsRefreshing(true);
      const fresh = await refreshEvents(city.name);
      await saveCachedEvents(city.name, fresh);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      const fallback = getEventsMemory() ?? (await getLastCachedEvents());
      if (fallback) setEventsMemory(fallback);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { events, isLoading, isRefreshing, cityName, reload: () => load(true) };
}

export function useSavedEvents() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCachedSavedIds().then((ids) => setSavedIds(new Set(ids)));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      void saveCachedSavedIds([...next]);
      return next;
    });
  }, []);

  return { savedIds, toggleSave };
}
