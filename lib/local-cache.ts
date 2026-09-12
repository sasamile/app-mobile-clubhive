import type { DiscoverEvent } from "@/lib/discover-events";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Envelope<T> = {
  data: T;
  updatedAt: number;
};

const KEY = {
  events: (city: string) => `cache:events:${city.trim().toLowerCase()}`,
  lastEvents: "cache:events:last",
  cities: "cache:cities",
  event: (id: string) => `cache:event:${id}`,
  myEvents: "cache:my-events",
  ticketPass: (slug: string) => `cache:ticket-pass:${slug}`,
  savedIds: "cache:saved-ids",
} as const;

export const EVENTS_FRESH_MS = 60_000;
export const CITIES_FRESH_MS = 12 * 60 * 60 * 1000;

async function readEnvelope<T>(key: string): Promise<Envelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (!parsed || typeof parsed !== "object" || !("data" in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeEnvelope<T>(key: string, data: T): Promise<void> {
  try {
    const envelope: Envelope<T> = { data, updatedAt: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    console.error("Error al guardar cache local:", error);
  }
}

export type EventsSnapshot = {
  cityName: string;
  events: DiscoverEvent[];
  updatedAt: number;
};

let eventsMemory: EventsSnapshot | null = null;
const eventsListeners = new Set<(snapshot: EventsSnapshot | null) => void>();

function emitEvents() {
  eventsListeners.forEach((listener) => listener(eventsMemory));
}

export function getEventsMemory(): EventsSnapshot | null {
  return eventsMemory;
}

export function subscribeEventsCache(
  listener: (snapshot: EventsSnapshot | null) => void
) {
  eventsListeners.add(listener);
  listener(eventsMemory);
  return () => {
    eventsListeners.delete(listener);
  };
}

export function setEventsMemory(snapshot: EventsSnapshot) {
  eventsMemory = snapshot;
  emitEvents();
}

export async function getCachedEvents(
  cityName: string
): Promise<EventsSnapshot | null> {
  const envelope = await readEnvelope<DiscoverEvent[]>(KEY.events(cityName));
  if (!envelope) return null;
  return {
    cityName,
    events: Array.isArray(envelope.data) ? envelope.data : [],
    updatedAt: envelope.updatedAt,
  };
}

export async function getLastCachedEvents(): Promise<EventsSnapshot | null> {
  const envelope = await readEnvelope<EventsSnapshot>(KEY.lastEvents);
  if (!envelope?.data?.cityName) return null;
  return {
    cityName: envelope.data.cityName,
    events: Array.isArray(envelope.data.events) ? envelope.data.events : [],
    updatedAt: envelope.updatedAt,
  };
}

export async function saveCachedEvents(
  cityName: string,
  events: DiscoverEvent[]
): Promise<EventsSnapshot> {
  const snapshot: EventsSnapshot = {
    cityName,
    events,
    updatedAt: Date.now(),
  };
  setEventsMemory(snapshot);
  await Promise.all([
    writeEnvelope(KEY.events(cityName), events),
    writeEnvelope(KEY.lastEvents, snapshot),
  ]);
  return snapshot;
}

export async function getCachedCities<T>(): Promise<Envelope<T[]> | null> {
  const envelope = await readEnvelope<T[]>(KEY.cities);
  if (!envelope || !Array.isArray(envelope.data)) return null;
  return envelope;
}

export async function saveCachedCities<T>(cities: T[]): Promise<void> {
  await writeEnvelope(KEY.cities, cities);
}

export async function getCachedEventDetail<T>(id: string): Promise<T | null> {
  const envelope = await readEnvelope<T>(KEY.event(id));
  return envelope?.data ?? null;
}

export async function saveCachedEventDetail<T>(id: string, data: T): Promise<void> {
  await writeEnvelope(KEY.event(id), data);
}

export async function getCachedMyEvents<T>(): Promise<T[] | null> {
  const envelope = await readEnvelope<T[]>(KEY.myEvents);
  if (!envelope || !Array.isArray(envelope.data)) return null;
  return envelope.data;
}

export async function saveCachedMyEvents<T>(rows: T[]): Promise<void> {
  await writeEnvelope(KEY.myEvents, rows);
}

export type CachedTicketPass = {
  qr: string;
  ticketName: string;
};

export async function getCachedTicketPass(
  slug: string
): Promise<CachedTicketPass | null> {
  const envelope = await readEnvelope<CachedTicketPass>(KEY.ticketPass(slug));
  return envelope?.data ?? null;
}

export async function saveCachedTicketPass(
  slug: string,
  pass: CachedTicketPass
): Promise<void> {
  await writeEnvelope(KEY.ticketPass(slug), pass);
}

export async function getCachedSavedIds(): Promise<string[]> {
  const envelope = await readEnvelope<string[]>(KEY.savedIds);
  return Array.isArray(envelope?.data) ? envelope.data : [];
}

export async function saveCachedSavedIds(ids: string[]): Promise<void> {
  await writeEnvelope(KEY.savedIds, ids);
}

export async function clearUserLocalCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(
      (key) =>
        key === KEY.myEvents ||
        key === KEY.savedIds ||
        key.startsWith("cache:ticket-pass:")
    );
    if (userKeys.length > 0) {
      await AsyncStorage.multiRemove(userKeys);
    }
  } catch (error) {
    console.error("Error al limpiar cache de usuario:", error);
  }
}
