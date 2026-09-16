import api from "@/lib/api";

export type OrganizerProfile = {
  name: string;
  email: string;
  picture: string | null;
  totalRevenue: number;
  totalTicketsSold: number;
};

export type OrganizerEventItem = {
  id: number;
  slug: string;
  name: string;
  date: string;
  time: string;
  img: string | null;
  cityName: string;
  location: string;
  state: boolean;
  sold: number;
  total: number;
  revenue: number;
};

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatOrganizerMoney(value: number) {
  return money(value);
}

export function formatOrganizerDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatOrganizerTime(time: string) {
  return time?.slice(0, 5) || "";
}

export async function fetchOrganizerProfile(): Promise<OrganizerProfile | null> {
  const { data } = await api.get("/organizers/get");
  const row = data as Partial<OrganizerProfile> | null;
  if (!row) return null;
  return {
    name: row.name?.trim() || "Organizador",
    email: row.email?.trim() || "",
    picture: row.picture?.trim() || null,
    totalRevenue: Number(row.totalRevenue) || 0,
    totalTicketsSold: Number(row.totalTicketsSold) || 0,
  };
}

export async function fetchOrganizerEvents(): Promise<OrganizerEventItem[]> {
  const { data } = await api.get("/events");
  const list = Array.isArray(data) ? data : [];
  return list.map((event: Record<string, unknown>) => {
    const tickets = Array.isArray(event.tickets) ? event.tickets : [];
    const sold = tickets.reduce(
      (sum, ticket) => sum + (Number((ticket as { sold?: number }).sold) || 0),
      0
    );
    const total = tickets.reduce(
      (sum, ticket) =>
        sum + (Number((ticket as { qua?: number }).qua) || 0),
      0
    );
    const revenue = tickets.reduce((sum, ticket) => {
      const row = ticket as { sold?: number; price?: number };
      return sum + (Number(row.sold) || 0) * (Number(row.price) || 0);
    }, 0);
    return {
      id: Number(event.id),
      slug: String(event.slug ?? ""),
      name: String(event.name ?? "Evento"),
      date: String(event.date ?? ""),
      time: String(event.time ?? ""),
      img: typeof event.img === "string" ? event.img : null,
      cityName: String(event.cityName ?? ""),
      location: String(event.location ?? ""),
      state: event.state !== false,
      sold,
      total,
      revenue,
    };
  });
}
