import api from "@/lib/api";
import type { Category } from "@/constants/discover";
import {
  formatEventDateShort,
  formatEventPrice,
  formatEventTimeClock,
} from "@/lib/format-event";

export interface ApiEvent {
  id: number;
  name: string;
  desc: string;
  date: string;
  time?: string | number[] | { hour?: number; minute?: number };
  cityName: string;
  location: string;
  img: string;
  organizerEvent?: { name: string; picture: string };
  promoters?: Array<{ name: string }>;
  lowerPrice: number;
}

export type DiscoverEvent = {
  id: string;
  name: string;
  category: Category;
  dateShort: string;
  dateRaw: string;
  time: string;
  price: string;
  lowerPrice: number;
  venue: string;
  cityName: string;
  image?: string;
  searchText: string;
};

export type PriceFilter = "todos" | "gratis" | "pago";
export type DateFilter = "todos" | "hoy" | "fin_de_semana" | "semana";

export function inferCategory(name: string, desc: string): Category {
  const t = `${name} ${desc}`.toLowerCase();
  if (/gastro|comida|food|chef|sabor/.test(t)) return "Gastronomía";
  if (/festival/.test(t)) return "Festivales";
  if (/deporte|sport|fútbol|futbol|run/.test(t)) return "Deportes";
  if (/negocio|business|tech|networking|profesional/.test(t)) return "Negocios";
  if (/música|musica|concierto|dj|band|live|llanero/.test(t)) return "Música";
  return "Música";
}

export function mapEvent(event: ApiEvent): DiscoverEvent {
  const name = event.name ?? "";
  const venue = event.location || event.cityName || "";
  const artists = (event.promoters ?? []).map((p) => p.name).join(" ");
  return {
    id: String(event.id),
    name,
    category: inferCategory(name, event.desc ?? ""),
    dateShort: formatEventDateShort(event.date),
    dateRaw: event.date ?? "",
    time: formatEventTimeClock(event.time),
    price:
      event.lowerPrice > 0 ? formatEventPrice(event.lowerPrice) : "Entrada libre",
    lowerPrice: Number(event.lowerPrice) || 0,
    venue,
    cityName: event.cityName || "",
    image: event.img,
    searchText: `${name} ${event.desc ?? ""} ${venue} ${artists}`.toLowerCase(),
  };
}

export async function fetchEventsByCity(cityName: string): Promise<DiscoverEvent[]> {
  const response = await api.get(
    `/events/search?search=${encodeURIComponent(cityName)}`
  );
  const apiEvents: ApiEvent[] = Array.isArray(response.data) ? response.data : [];
  return apiEvents.map(mapEvent);
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isToday(value: string): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isThisWeekend(value: string): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  if (day === 0) start.setDate(start.getDate() - 2);
  else if (day === 6) start.setDate(start.getDate() - 1);
  else start.setDate(start.getDate() + (5 - day));
  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export function isNext7Days(value: string): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export function filterEvents(
  events: DiscoverEvent[],
  options: {
    query?: string;
    category?: Category;
    price?: PriceFilter;
    date?: DateFilter;
  }
): DiscoverEvent[] {
  const q = options.query?.trim().toLowerCase() ?? "";
  const category = options.category ?? "Todos";
  const price = options.price ?? "todos";
  const date = options.date ?? "todos";

  return events.filter((event) => {
    const catOk = category === "Todos" || event.category === category;
    const qOk = !q || event.searchText.includes(q);
    const priceOk =
      price === "todos" ||
      (price === "gratis" && event.lowerPrice <= 0) ||
      (price === "pago" && event.lowerPrice > 0);
    const dateOk =
      date === "todos" ||
      (date === "hoy" && isToday(event.dateRaw)) ||
      (date === "fin_de_semana" && isThisWeekend(event.dateRaw)) ||
      (date === "semana" && isNext7Days(event.dateRaw));
    return catOk && qOk && priceOk && dateOk;
  });
}

export function isPastEvent(value: string): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return date < start;
}

export function isUpcomingEvent(value: string): boolean {
  return !isPastEvent(value);
}

export function sortByDateAsc(events: DiscoverEvent[]): DiscoverEvent[] {
  return [...events].sort((a, b) => {
    const da = parseDate(a.dateRaw)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const db = parseDate(b.dateRaw)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return da - db;
  });
}

export function sortByDateDesc(events: DiscoverEvent[]): DiscoverEvent[] {
  return [...events].sort((a, b) => {
    const da = parseDate(a.dateRaw)?.getTime() ?? 0;
    const db = parseDate(b.dateRaw)?.getTime() ?? 0;
    return db - da;
  });
}

export function uniqueById(
  events: DiscoverEvent[],
  exclude: Set<string> = new Set()
): DiscoverEvent[] {
  const seen = new Set(exclude);
  const result: DiscoverEvent[] = [];
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    result.push(event);
  }
  return result;
}
