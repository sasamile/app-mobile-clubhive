import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { NativeModulesProxy } from "expo-modules-core";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface ApiEventDetail {
  id: string;
  name: string;
  desc: string;
  time: string;
  date: string;
  state: boolean;
  location: string;
  address: string;
  img: string;
  cityName: string;
  organizerEvent: {
    name: string;
    email: string;
    picture: string;
    organizerId: string;
  };
  tickets: Array<{
    id: number;
    name: string;
    desc: string;
    price: number;
    qua: number;
    eventId: string;
    state: boolean;
    available: number;
    sold?: number;
  }>;
  promoters: Array<{
    id: number;
    code: string;
    name: string;
    eventId: number;
  }>;
  lowerPrice: number;
}

export default function EventDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
  }>();

  const [eventData, setEventData] = useState<ApiEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  const [formattedPrice, setFormattedPrice] = useState("");

  const hasNativeBlur = !!(NativeModulesProxy as any)?.ExpoBlurView;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadEventData = async () => {
      if (!params.id) {
        Alert.alert("Error", "ID del evento no encontrado");
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get(`/events/get/${params.id}`);
        const event: ApiEventDetail = response.data;

        // Formatear fecha
        const eventDate = new Date(event.date);
        const months = [
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
        const formattedDateStr = `${eventDate.getDate()} de ${
          months[eventDate.getMonth()]
        }`;

        // Formatear hora
        const timeParts = event.time.split(":");
        const hour = parseInt(timeParts[0]);
        const minute = timeParts[1];
        const period = hour >= 12 ? "p.m" : "a.m";
        const formattedHour =
          hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const formattedTimeStr = `${formattedHour}:${minute} ${period}`;

        // Formatear precio
        const formattedPriceStr = `Desde $${Math.round(
          event.lowerPrice
        ).toLocaleString("es-CO")}`;

        setEventData(event);
        setFormattedDate(formattedDateStr);
        setFormattedTime(formattedTimeStr);
        setFormattedPrice(formattedPriceStr);
      } catch (error: any) {
        console.error("Error al cargar evento:", error);
        Alert.alert(
          "Error",
          "No se pudo cargar la información del evento. Por favor, intenta de nuevo.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
  }, [params.id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Cargando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No se encontró el evento</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Capa 1: Imagen de fondo absoluta (misma del evento) */}
      {eventData.img ? (
        <Image
          source={{ uri: eventData.img }}
          style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.2 }] }]}
          contentFit="cover"
          blurRadius={22}
        />
      ) : (
        <LinearGradient
          colors={["#2e026d", "#15162c"]}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* Capa 2: Overlay para contraste */}
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.7)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Contenido encima del blur */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con botón volver */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Poster nítido encima del blur */}
        <View style={styles.posterContainer}>
          {eventData.img ? (
            <Image
              source={{ uri: eventData.img }}
              style={styles.poster}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={["#2e026d", "#15162c"]}
              style={styles.poster}
            />
          )}
        </View>

        {/* Card info */}
        <View style={styles.card}>
          <Text style={styles.title}>{eventData.name.toUpperCase()}</Text>
          <Text style={styles.datetime}>
            {formattedDate}, {formattedTime}
          </Text>

          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color="#FFFFFF" />
            <Text style={styles.locationText}>{eventData.cityName}</Text>
          </View>

          {eventData.address && (
            <View style={styles.row}>
              <Ionicons name="map-outline" size={18} color="#FFFFFF" />
              <Text style={styles.locationText}>{eventData.address}</Text>
            </View>
          )}

          {eventData.desc && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.descriptionText}>{eventData.desc}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organizador</Text>
            <View style={styles.organizerRow}>
              {eventData.organizerEvent.picture ? (
                <Image
                  source={{ uri: eventData.organizerEvent.picture }}
                  style={styles.organizerLogo}
                />
              ) : (
                <View style={styles.organizerLogoFallback} />
              )}
              <Text style={styles.organizerName}>
                {eventData.organizerEvent.name}
              </Text>
            </View>
            <Text></Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer compra */}
      <View style={styles.footerContainer}>
        {/* Fondo con blur en el footer */}
        {hasNativeBlur ? (
          <>
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            {/* Overlay oscuro casi transparente sobre el blur */}
            <View style={styles.footerOverlay} />
          </>
        ) : (
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.6)", "rgba(30, 30, 30, 0.85)"]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View
          style={[
            styles.footer,
            {
              // cubrir completamente hasta el borde inferior (incluye notch)
              paddingBottom: insets?.bottom || 0,
            },
          ]}
        >
          <Text style={styles.priceText}>
            {formattedPrice.replace("Desde $", "Desde :$")} COP
          </Text>
          <TouchableOpacity
            style={styles.buyButton}
            activeOpacity={0.9}
            onPress={() => {
              router.push({
                pathname: "/(users)/event/[id]/tickets",
                params: { id: params.id },
              });
            }}
          >
            <Text style={styles.buyText}>Comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    paddingBottom: 140, // deja más espacio para el footer fijo y alto
    paddingTop: 8,
  },
  headerRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  posterContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  poster: {
    width: "100%",
    height: 340,
    borderRadius: 16,
  },
  card: {
    marginTop: 12,
    padding: 16,

  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  datetime: {
    color: "#FFFFFF",
    opacity: 0.85,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  locationText: {
    color: "#FFFFFF",
    opacity: 0.9,
  },
  section: {
    marginTop: 4,
  },
  sectionTitle: {
    color: "#FFFFFF",
    opacity: 0.7,
    marginBottom: 8,
    fontWeight: "600",
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  organizerLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  organizerLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  organizerName: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  descriptionText: {
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 22,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    position: "relative",
    zIndex: 1,
  },
  footerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(40, 40, 40, 0.5)",
  },
  priceText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  buyButton: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buyText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  footerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
});
