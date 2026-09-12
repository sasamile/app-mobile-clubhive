const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const MONTHS_FULL = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function hourFromUnknown(value: unknown): { hour: number; minute: number } | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return { hour: Number(match[1]), minute: Number(match[2]) };
    }
    return null;
  }

  if (Array.isArray(value) && value.length >= 2) {
    const hour = Number(value[0]);
    const minute = Number(value[1]);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      return { hour, minute };
    }
    return null;
  }

  if (typeof value === "object") {
    const record = value as { hour?: unknown; minute?: unknown };
    const hour = Number(record.hour);
    const minute = Number(record.minute);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      return { hour, minute };
    }
  }

  return null;
}

export function formatEventDate(value: unknown): string {
  if (value == null || value === "") return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function formatEventTime(value: unknown): string {
  const parts = hourFromUnknown(value);
  if (!parts) return "";

  const period = parts.hour >= 12 ? "p.m" : "a.m";
  const hour12 =
    parts.hour > 12 ? parts.hour - 12 : parts.hour === 0 ? 12 : parts.hour;
  return `${hour12}:${pad(parts.minute)} ${period}`;
}

export function formatEventTimeClock(value: unknown): string {
  const parts = hourFromUnknown(value);
  if (!parts) return "";
  const period = parts.hour >= 12 ? "PM" : "AM";
  const hour12 =
    parts.hour > 12 ? parts.hour - 12 : parts.hour === 0 ? 12 : parts.hour;
  return `${hour12}:${pad(parts.minute)} ${period}`;
}

export function formatEventDateShort(value: unknown): string {
  if (value == null || value === "") return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS[date.getMonth()].toUpperCase()}`;
}

export function formatEventWeekdayLong(value: unknown): string {
  if (value == null || value === "") return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS_FULL[date.getMonth()]}`;
}

export function formatEventPrice(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return `Desde $${Math.round(amount).toLocaleString("es-CO")}`;
}

export function formatEventPriceAmount(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Entrada libre";
  return `$${Math.round(amount).toLocaleString("es-CO")}`;
}

/** GET /events/get/:id responde { eventSaved, layoutConfig }. */
export function unwrapEventPayload<T extends object>(data: unknown): T | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const nested = record.eventSaved ?? record.event;
  if (nested && typeof nested === "object") {
    return nested as T;
  }
  if ("name" in record || "tickets" in record || "id" in record) {
    return data as T;
  }
  return null;
}
