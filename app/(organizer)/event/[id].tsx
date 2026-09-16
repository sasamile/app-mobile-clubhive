import api from "@/lib/api";
import { formatOrganizerMoney } from "@/lib/organizer-panel";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Dashboard = {
  name?: string;
  date?: string;
  time?: string;
  imageUrl?: string;
  city?: string;
  location?: string;
  totalTicketsSold?: number;
  totalAmount?: number;
  totalNetOrganizer?: number;
};

export default function OrganizerEventScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const response = await api.get(`/dashboard?idEvent=${id}`);
        if (alive) setData(response.data as Dashboard);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />
      <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        <Text style={styles.backLabel}>Eventos</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color="#7C4DFF" style={styles.loader} />
      ) : !data ? (
        <Text style={styles.empty}>No se pudo cargar este evento.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {data.imageUrl ? (
            <Image
              source={{ uri: data.imageUrl }}
              style={styles.cover}
              contentFit="cover"
            />
          ) : null}
          <Text style={styles.title}>{data.name || "Evento"}</Text>
          <Text style={styles.meta}>
            {[data.date, data.time?.slice(0, 5), data.city || data.location]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.totalTicketsSold ?? 0}</Text>
              <Text style={styles.statLabel}>Boletas</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatOrganizerMoney(Number(data.totalAmount) || 0)}
              </Text>
              <Text style={styles.statLabel}>Ventas</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatOrganizerMoney(Number(data.totalNetOrganizer) || 0)}
              </Text>
              <Text style={styles.statLabel}>Neto</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 20,
  },
  back: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  backLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },
  cover: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: "#141414",
    marginBottom: 18,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  meta: {
    marginTop: 8,
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  stat: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    marginTop: 6,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
});
