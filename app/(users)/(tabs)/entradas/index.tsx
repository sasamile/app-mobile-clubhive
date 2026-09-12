import {
  EventTicketCard,
  EventTicketCardSkeleton,
  TicketNotches,
  TicketPerforation,
} from "@/components/event-ticket-card";
import { ScreenAtmosphere } from "@/components/discover/screen-atmosphere";
import { Discover, FLOATING_TAB_INSET } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import api from "@/lib/api";
import { formatEventDate, formatEventTime } from "@/lib/format-event";
import {
  getCachedMyEvents,
  getCachedTicketPass,
  saveCachedMyEvents,
  saveCachedTicketPass,
} from "@/lib/local-cache";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND = Discover.accent;

type EventInfo = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  date?: string;
  time?: string | number[] | { hour?: number; minute?: number };
  cityName?: string;
  location?: string;
  address?: string;
  imageUrl?: string;
};

type MyEventRow = {
  event: EventInfo;
  totalTicketsCount?: number;
  redeemedTicketsCount?: number;
};

type TicketPass = {
  token?: string;
  status?: string;
  ticketName?: string;
};

type Purchase = {
  qrCode?: string;
  ticketsCount?: number;
  passes?: TicketPass[];
  tickets?: Array<{ name?: string }>;
};

type Entrada = {
  id: string;
  slug: string;
  eventName: string;
  date: string;
  ticketCount: number;
  ticketType: string;
  venue?: string;
  image?: string;
};

function quantityLabel(count: number, redeemed: boolean) {
  if (redeemed && count <= 0) return "Usada";
  return count === 1 ? "1 entrada" : `${count} entradas`;
}

function mapRow(row: MyEventRow): Entrada | null {
  const event = row.event;
  if (!event?.id) return null;
  const active = row.totalTicketsCount ?? 0;
  const redeemed = row.redeemedTicketsCount ?? 0;
  return {
    id: String(event.id),
    slug: event.slug,
    eventName: event.name ?? "Evento",
    date: [formatEventDate(event.date), formatEventTime(event.time)]
      .filter(Boolean)
      .join(" · "),
    ticketCount: active > 0 ? active : redeemed,
    ticketType: active > 0 ? "Mi entrada" : "Usada",
    venue: event.cityName || event.location,
    image: event.imageUrl,
  };
}

function pickQr(purchases: Purchase[]): { value: string; ticketName: string } {
  for (const purchase of purchases) {
    const live = (purchase.passes ?? []).find(
      (pass) => pass.status === "NEW" && pass.token
    );
    if (live?.token) {
      return {
        value: live.token,
        ticketName: live.ticketName ?? purchase.tickets?.[0]?.name ?? "Entrada",
      };
    }
  }
  const first = purchases[0];
  const fallbackPass = first?.passes?.[0];
  return {
    value: fallbackPass?.token || first?.qrCode || "",
    ticketName:
      fallbackPass?.ticketName ?? first?.tickets?.[0]?.name ?? "Entrada",
  };
}

export default function EntradasScreen() {
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Entrada | null>(null);
  const [passQr, setPassQr] = useState("");
  const [passType, setPassType] = useState("Entrada");
  const [isPassLoading, setIsPassLoading] = useState(false);

  const loadEntradas = useCallback(async () => {
    const cached = await getCachedMyEvents<Entrada>();
    if (cached && cached.length > 0) {
      setEntradas(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.get("/sales/my-events");
      const rows: MyEventRow[] = Array.isArray(response.data)
        ? response.data
        : [];
      const mapped = rows
        .map(mapRow)
        .filter((row): row is Entrada => row != null);
      setEntradas(mapped);
      await saveCachedMyEvents(mapped);
    } catch (error) {
      console.error("Error al cargar entradas:", error);
      if (!cached?.length) setEntradas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntradas();
    }, [loadEntradas])
  );

  const openPass = async (entrada: Entrada) => {
    setSelected(entrada);
    setPassQr("");
    setPassType(entrada.ticketType);
    setIsPassLoading(true);
    const cachedPass = await getCachedTicketPass(entrada.slug);
    if (cachedPass?.qr) {
      setPassQr(cachedPass.qr);
      setPassType(cachedPass.ticketName);
      setIsPassLoading(false);
    }
    try {
      const response = await api.get(
        `/sales/my-tickets/${encodeURIComponent(entrada.slug)}`
      );
      const purchases: Purchase[] = Array.isArray(response.data?.purchases)
        ? response.data.purchases
        : [];
      const pass = pickQr(purchases);
      setPassQr(pass.value);
      setPassType(pass.ticketName);
      if (pass.value) {
        await saveCachedTicketPass(entrada.slug, {
          qr: pass.value,
          ticketName: pass.ticketName,
        });
      }
    } catch (error) {
      console.error("Error al cargar el pase:", error);
    } finally {
      setIsPassLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]} collapsable={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={theme.statusBar} />
      <ScreenAtmosphere height={220} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: FLOATING_TAB_INSET + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: theme.ink }]}>Entradas</Text>
        {isLoading && entradas.length === 0 ? (
          <View style={styles.list}>
            <EventTicketCardSkeleton />
            <EventTicketCardSkeleton />
            <EventTicketCardSkeleton />
          </View>
        ) : entradas.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
              <Ionicons name="ticket-outline" size={28} color={BRAND} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>Aún no tienes entradas</Text>
            <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
              Cuando compres un evento, tu ticket aparece aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entradas.map((entrada) => (
              <EventTicketCard
                key={entrada.id}
                title={entrada.eventName}
                date={entrada.date}
                badge={quantityLabel(
                  entrada.ticketCount,
                  entrada.ticketType === "Usada"
                )}
                kicker={entrada.ticketType}
                venue={entrada.venue}
                image={entrada.image}
                actionIcon="ticket"
                onPress={() => openPass(entrada)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TicketPassModal
        ticket={selected}
        qrValue={passQr}
        ticketType={passType}
        isLoading={isPassLoading}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function TicketPassModal({
  ticket,
  qrValue,
  ticketType,
  isLoading,
  onClose,
}: {
  ticket: Entrada | null;
  qrValue: string;
  ticketType: string;
  isLoading: boolean;
  onClose: () => void;
}) {
  const [topHeight, setTopHeight] = useState(280);
  const visible = ticket != null;
  const qrUrl = qrValue
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
        qrValue
      )}&bgcolor=FFFFFF&color=111111&margin=8`
    : "";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalSheet} pointerEvents="box-none">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mi entrada</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={12}
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={20} color={Discover.ink} />
            </TouchableOpacity>
          </View>

          {ticket ? (
            <View style={styles.passWrap}>
              <View style={styles.pass}>
                <View
                  style={styles.passTop}
                  onLayout={(e) => setTopHeight(e.nativeEvent.layout.height)}
                >
                  <Text style={styles.passKicker}>Tiked</Text>
                  <View style={styles.qrFrame}>
                    {qrUrl ? (
                      <Image
                        source={{ uri: qrUrl }}
                        style={styles.qrImage}
                        contentFit="contain"
                      />
                    ) : (
                      <View style={[styles.qrImage, styles.qrPlaceholder]}>
                        <Text style={styles.qrHint}>
                          {isLoading
                            ? "Cargando código…"
                            : "No hay código disponible"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.qrHint}>
                    Muestra este código en la puerta
                  </Text>
                </View>

                <TicketPerforation />

                <View style={styles.passStub}>
                  {ticket.image ? (
                    <Image
                      source={{ uri: ticket.image }}
                      style={styles.thumb}
                      contentFit="cover"
                      contentPosition="top"
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]} />
                  )}
                  <View style={styles.passCopy}>
                    <Text style={styles.passEvent} numberOfLines={2}>
                      {ticket.eventName}
                    </Text>
                    <Text style={styles.passMeta}>{ticket.date}</Text>
                    {ticket.venue ? (
                      <Text style={styles.passMeta}>{ticket.venue}</Text>
                    ) : null}
                    <Text style={styles.passType}>{ticketType}</Text>
                  </View>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{ticket.ticketCount}</Text>
                  </View>
                </View>
              </View>

              <TicketNotches heroHeight={topHeight} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.9,
    marginBottom: 18,
  },
  list: {
    gap: 20,
  },
  empty: {
    paddingTop: 48,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Discover.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(10,10,10,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalSheet: {
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  passWrap: {
    position: "relative",
  },
  pass: {
    backgroundColor: Discover.surface,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Discover.line,
  },
  passTop: {
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 8,
    paddingHorizontal: 24,
    gap: 14,
  },
  passKicker: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: BRAND,
  },
  qrFrame: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
  },
  qrImage: {
    width: 188,
    height: 188,
  },
  qrPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F5",
  },
  qrHint: {
    fontSize: 13,
    fontWeight: "500",
    color: "#A1A1AA",
    textAlign: "center",
  },
  passStub: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 18,
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Discover.chip,
  },
  thumbFallback: {
    backgroundColor: Discover.chip,
  },
  passCopy: {
    flex: 1,
    gap: 3,
  },
  passEvent: {
    fontSize: 16,
    fontWeight: "700",
    color: Discover.ink,
    letterSpacing: -0.2,
  },
  passMeta: {
    fontSize: 13,
    fontWeight: "500",
    color: Discover.muted,
  },
  passType: {
    fontSize: 13,
    fontWeight: "600",
    color: Discover.ink,
    marginTop: 2,
  },
  qtyBadge: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
