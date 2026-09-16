import {
  fetchOrganizerEvents,
  fetchOrganizerProfile,
  formatOrganizerDate,
  formatOrganizerMoney,
  formatOrganizerTime,
  type OrganizerEventItem,
  type OrganizerProfile,
} from "@/lib/organizer-panel";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#7C4DFF";

export default function OrganizerEventsScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [events, setEvents] = useState<OrganizerEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    try {
      const [nextProfile, nextEvents] = await Promise.all([
        fetchOrganizerProfile(),
        fetchOrganizerEvents(),
      ]);
      setProfile(nextProfile);
      setEvents(nextEvents);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const upcoming = events.filter((event) => {
    const [year, month, day] = event.date.split("-").map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return event.state && date >= today;
  });
  const past = events.filter((event) => !upcoming.includes(event) && event.state);
  const inactive = events.filter((event) => !event.state);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor="#FFFFFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("@/assets/logos/tiked-logo-blanco.svg")}
          style={styles.wordmark}
          contentFit="contain"
        />
        <Text style={styles.pageTitle}>Tus eventos</Text>

        {profile ? (
          <View style={styles.club}>
            {profile.picture ? (
              <Image
                source={{ uri: profile.picture }}
                style={styles.clubLogo}
                contentFit="cover"
              />
            ) : (
              <View style={styles.clubLogoFallback}>
                <Text style={styles.clubInitial}>
                  {profile.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.clubCopy}>
              <Text style={styles.clubName} numberOfLines={1}>
                {profile.name}
              </Text>
              <Text style={styles.clubMeta}>
                {profile.totalTicketsSold} boletas ·{" "}
                {formatOrganizerMoney(profile.totalRevenue)}
              </Text>
            </View>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={ACCENT} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aún no tienes eventos</Text>
            <Text style={styles.emptyBody}>
              Cuando publiques uno, aparece aquí para que veas ventas y
              asistencia.
            </Text>
          </View>
        ) : (
          <>
            <EventGroup title="Próximos" items={upcoming} />
            <EventGroup title="Anteriores" items={past} />
            <EventGroup title="Desactivados" items={inactive} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function EventGroup({
  title,
  items,
}: {
  title: string;
  items: OrganizerEventItem[];
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {items.map((event) => (
        <Pressable
          key={event.id}
          onPress={() =>
            router.push({
              pathname: "/(organizer)/event/[id]",
              params: { id: String(event.id) },
            })
          }
          style={styles.card}
        >
          {event.img ? (
            <Image
              source={{ uri: event.img }}
              style={styles.cardImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.cardImageEmpty]} />
          )}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {event.name}
            </Text>
            <Text style={styles.cardMeta}>
              {formatOrganizerDate(event.date)}
              {event.time ? ` · ${formatOrganizerTime(event.time)}` : ""}
            </Text>
            <Text style={styles.cardSales}>
              {event.sold}/{event.total} boletas ·{" "}
              {formatOrganizerMoney(event.revenue)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  wordmark: {
    width: 110,
    height: 38,
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  club: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#141414",
    marginBottom: 28,
  },
  clubLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  clubLogoFallback: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  clubInitial: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  clubCopy: {
    flex: 1,
  },
  clubName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  clubMeta: {
    marginTop: 4,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },
  loading: {
    paddingTop: 48,
    alignItems: "center",
  },
  empty: {
    paddingTop: 48,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyBody: {
    marginTop: 10,
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  group: {
    marginBottom: 28,
    gap: 12,
  },
  groupTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#141414",
  },
  cardImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  cardImageEmpty: {
    backgroundColor: "#1F1F1F",
  },
  cardBody: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cardMeta: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textTransform: "capitalize",
  },
  cardSales: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "600",
  },
});
