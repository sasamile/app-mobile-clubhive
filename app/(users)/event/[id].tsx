import { Discover, type DiscoverPalette } from "@/constants/discover";
import { useDiscoverTheme, useThemedStyles } from "@/hooks/use-discover-theme";
import api from "@/lib/api";
import {
  formatEventPriceAmount,
  formatEventTimeClock,
  formatEventWeekdayLong,
  unwrapEventPayload,
} from "@/lib/format-event";
import {
  getCachedEventDetail,
  getCachedSavedIds,
  getEventsMemory,
  saveCachedEventDetail,
  saveCachedSavedIds,
} from "@/lib/local-cache";
import { EventLocationMap } from "@/components/event-location-map";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ApiEventDetail {
  id: string;
  name: string;
  desc: string;
  time?: string | number[] | { hour?: number; minute?: number };
  date: string;
  location: string;
  address: string;
  img: string;
  cityName: string;
  ageRating?: number;
  latitude?: number | string;
  longitude?: number | string;
  eventLocation?: {
    latitude?: number | string;
    longitude?: number | string;
    address?: string;
    locationName?: string;
  };
  organizerEvent?: {
    name: string;
    picture: string;
    email?: string;
  };
  lowerPrice: number;
}

function inferBadge(name: string, desc: string): string {
  const t = `${name} ${desc}`.toLowerCase();
  if (/festival/.test(t)) return "Festival";
  if (/gastro/.test(t)) return "Gastronomía";
  if (/tech|negocio/.test(t)) return "Negocios";
  return "Música";
}

function readCoord(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapCoords(event: ApiEventDetail) {
  const lat = readCoord(event.latitude) ?? readCoord(event.eventLocation?.latitude);
  const lng = readCoord(event.longitude) ?? readCoord(event.eventLocation?.longitude);
  if (lat == null || lng == null) return null;
  const swapped = lat >= -80 && lat <= -60 && lng >= -5 && lng <= 15;
  return swapped ? { lat: lng, lng: lat } : { lat, lng };
}

function seedFromList(id: string): ApiEventDetail | null {
  const listed = getEventsMemory()?.events.find((event) => event.id === id);
  if (!listed) return null;
  return {
    id: listed.id,
    name: listed.name,
    desc: "",
    date: listed.dateRaw,
    location: listed.venue,
    address: "",
    img: listed.image ?? "",
    cityName: listed.cityName,
    lowerPrice: listed.lowerPrice,
  };
}

export default function EventDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();
  const styles = useThemedStyles(createEventStyles);
  const [eventData, setEventData] = useState<ApiEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    getCachedSavedIds().then((ids) => setSaved(ids.includes(params.id)));
  }, [params.id]);

  useEffect(() => {
    const load = async () => {
      if (!params.id) {
        Alert.alert("Error", "ID del evento no encontrado");
        router.back();
        return;
      }
      const cached = await getCachedEventDetail<ApiEventDetail>(params.id);
      const seeded = cached ?? seedFromList(params.id);
      if (seeded) {
        setEventData(seeded);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      try {
        const response = await api.get(`/events/get/${params.id}`);
        const event = unwrapEventPayload<ApiEventDetail>(response.data);
        if (!event) throw new Error("invalid");
        setEventData(event);
        await saveCachedEventDetail(params.id, event);
      } catch {
        if (!seeded) {
          Alert.alert("Error", "No se pudo cargar el evento.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [params.id]);

  if (isLoading || !eventData) {
    return (
      <View style={[styles.screen, { justifyContent: "center" }]}>
        <ActivityIndicator color={Discover.accent} />
      </View>
    );
  }

  const desc = eventData.desc ?? "";
  const shortDesc =
    desc.length > 220 && !expanded ? `${desc.slice(0, 220).trim()}…` : desc;
  const lowest = Number(eventData.lowerPrice);
  const isFree = !Number.isFinite(lowest) || lowest <= 0;
  const priceAmount = formatEventPriceAmount(lowest);
  const footerPad = Math.max(insets.bottom, 14);
  const coords = mapCoords(eventData);
  const mapQuery = encodeURIComponent(
    [eventData.address, eventData.location, eventData.cityName]
      .filter(Boolean)
      .join(", ")
  );
  const mapsUrl = coords
    ? `https://maps.apple.com/?ll=${coords.lat},${coords.lng}&q=${mapQuery}`
    : `https://maps.apple.com/?q=${mapQuery}`;
  const mapPreview = coords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=16&size=800x420&maptype=mapnik&markers=${coords.lat},${coords.lng},red-pushpin`
    : null;
  const placeLine = eventData.location || eventData.cityName;
  const ctaLabel = isFree ? "Entradas gratis" : `Entradas desde: ${priceAmount}`;

  const toggleSave = () => {
    setSaved((current) => {
      const next = !current;
      if (params.id) {
        void getCachedSavedIds().then((ids) => {
          const set = new Set(ids);
          if (next) set.add(params.id);
          else set.delete(params.id);
          return saveCachedSavedIds([...set]);
        });
      }
      return next;
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style={theme.statusBar} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 108 + footerPad,
        }}
      >
        <View style={styles.heroWrap}>
          <View style={[styles.hero, { backgroundColor: theme.chip }]}>
            {eventData.img ? (
              <Image
                source={{ uri: eventData.img }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="top"
              />
            ) : null}
            <Pressable
              onPress={() => router.back()}
              style={[styles.heroBtn, { left: 12, top: 12 }]}
              accessibilityLabel="Volver"
            >
              <Ionicons name="chevron-back" size={20} color="#111111" />
            </Pressable>
            <Pressable
              onPress={toggleSave}
              style={[styles.heroBtn, { right: 12, top: 12 }]}
              accessibilityLabel="Guardar evento"
            >
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={18}
                color={saved ? "#FF3B5C" : "#111111"}
              />
            </Pressable>
          </View>
          <Text style={[styles.trust, { color: theme.muted }]}>
            Tiked protege a sus usuarios. Tus entradas siempre estarán seguras con
            nosotros.
          </Text>
        </View>

        <View style={styles.body}>
          {placeLine ? (
            <Text style={[styles.kicker, { color: theme.muted }]} numberOfLines={1}>
              {placeLine}
            </Text>
          ) : null}
          <Text style={[styles.badge, { color: theme.accent }]}>
            {inferBadge(eventData.name, desc)}
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>{eventData.name}</Text>

          <View style={styles.metaBlock}>
            {eventData.date ? (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={theme.muted} />
                <Text style={[styles.metaText, { color: theme.ink }]}>
                  {formatEventWeekdayLong(eventData.date)}
                </Text>
              </View>
            ) : null}
            {eventData.time ? (
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={theme.muted} />
                <Text style={[styles.metaText, { color: theme.ink }]}>
                  {formatEventTimeClock(eventData.time)}
                </Text>
              </View>
            ) : null}
            {eventData.ageRating != null ? (
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={16} color={theme.muted} />
                <Text style={[styles.metaText, { color: theme.ink }]}>
                  {eventData.ageRating}+ años
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceBlock}>
            <Text style={[styles.priceFrom, { color: theme.muted }]}>Desde</Text>
            <Text style={[styles.price, { color: theme.ink }]}>
              {isFree ? "Gratis" : `${priceAmount} COP`}
            </Text>
          </View>

          {eventData.organizerEvent ? (
            <View
              style={[
                styles.organizer,
                { backgroundColor: theme.surface, borderColor: theme.line },
              ]}
            >
              {eventData.organizerEvent.picture ? (
                <Image
                  source={{ uri: eventData.organizerEvent.picture }}
                  style={styles.orgAvatar}
                />
              ) : (
                <View style={[styles.orgAvatar, { backgroundColor: theme.chip }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.orgName, { color: theme.ink }]} numberOfLines={1}>
                  {eventData.organizerEvent.name}
                </Text>
                <Text style={[styles.orgMeta, { color: theme.muted }]} numberOfLines={1}>
                  {eventData.organizerEvent.email || "Organizador"}
                </Text>
              </View>
            </View>
          ) : null}

          {desc ? (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: theme.ink }]}>
                Acerca de {eventData.name}
              </Text>
              <Text style={[styles.copy, { color: theme.muted }]}>{shortDesc}</Text>
              {desc.length > 220 ? (
                <Pressable onPress={() => setExpanded((value) => !value)}>
                  <Text style={[styles.more, { color: theme.ink }]}>
                    {expanded ? "Ver menos" : "Leer más"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {placeLine || eventData.address ? (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: theme.ink }]}>Ubicación</Text>
              <Pressable onPress={() => Linking.openURL(mapsUrl)}>
                <View
                  style={[
                    styles.mapCard,
                    { backgroundColor: theme.surface, borderColor: theme.line },
                  ]}
                >
                  {coords ? (
                    <EventLocationMap
                      latitude={coords.lat}
                      longitude={coords.lng}
                      title={eventData.location || eventData.name}
                      dark={theme.statusBar === "light"}
                    />
                  ) : mapPreview ? (
                    <Image
                      source={{ uri: mapPreview }}
                      style={styles.map}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.map, styles.mapFallback, { backgroundColor: theme.chip }]}>
                      <Ionicons name="map-outline" size={28} color={theme.muted} />
                    </View>
                  )}
                  <View style={styles.mapInfo}>
                    <Ionicons name="location" size={16} color={theme.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.placeTitle, { color: theme.ink }]}>
                        {eventData.cityName || eventData.location}
                      </Text>
                      {eventData.address ? (
                        <Text style={[styles.placeSub, { color: theme.muted }]}>
                          {eventData.address}
                        </Text>
                      ) : eventData.location ? (
                        <Text style={[styles.placeSub, { color: theme.muted }]}>
                          {eventData.location}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: footerPad,
            backgroundColor: theme.bg,
            borderTopColor: theme.line,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.buy, pressed && { opacity: 0.88 }]}
          onPress={() =>
            router.push({
              pathname: "/(users)/event/[id]/tickets",
              params: { id: params.id },
            })
          }
        >
          <Text style={styles.buyText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createEventStyles(t: DiscoverPalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.bg,
    },
    heroWrap: {
      paddingHorizontal: Discover.pad,
    },
    hero: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 24,
      overflow: "hidden",
    },
    heroBtn: {
      position: "absolute",
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.94)",
      alignItems: "center",
      justifyContent: "center",
    },
    trust: {
      marginTop: 10,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "500",
    },
    body: {
      paddingHorizontal: Discover.pad,
      paddingTop: 18,
    },
    kicker: {
      fontSize: 13,
      fontWeight: "500",
      marginBottom: 4,
    },
    badge: {
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 6,
    },
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    priceBlock: {
      marginBottom: 22,
    },
    priceFrom: {
      fontSize: 13,
      fontWeight: "500",
      marginBottom: 2,
    },
    price: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.6,
    },
    metaBlock: {
      gap: 10,
      marginTop: 16,
      marginBottom: 16,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    metaText: {
      fontSize: 15,
      fontWeight: "500",
    },
    organizer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 12,
      marginBottom: 24,
    },
    orgAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    orgName: {
      fontSize: 15,
      fontWeight: "700",
    },
    orgMeta: {
      fontSize: 13,
      marginTop: 2,
    },
    block: {
      marginBottom: 24,
      gap: 10,
    },
    blockTitle: {
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    copy: {
      fontSize: 15,
      lineHeight: 22,
    },
    more: {
      fontSize: 14,
      fontWeight: "700",
    },
    mapCard: {
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
    },
    map: {
      width: "100%",
      height: 180,
    },
    mapFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    mapInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    placeTitle: {
      fontSize: 15,
      fontWeight: "700",
    },
    placeSub: {
      fontSize: 13,
      marginTop: 2,
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    buy: {
      backgroundColor: Discover.accent,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    buyText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
