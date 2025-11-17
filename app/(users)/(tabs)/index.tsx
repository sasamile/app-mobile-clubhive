import { useColorScheme } from "@/hooks/use-color-scheme";
import api from "@/lib/api";
import { getSelectedCity, getUserData, saveSelectedCity } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";

import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ApiEvent {
  id: number;
  name: string;
  desc: string;
  date: string;
  time: string;
  cityId: number;
  cityName: string;
  location: string;
  address: string;
  img: string;
  state: boolean;
  organizerEvent: {
    name: string;
    email: string;
    picture: string;
    organizerId: string;
  };
  promoters: Array<{
    id: number;
    code: string;
    name: string;
    eventId: number;
    views: number;
  }>;
  tickets: Array<{
    id: number;
    name: string;
    desc: string;
    price: number;
    qua: number;
    idEvent: string;
    state: boolean;
    available: number;
  }>;
  lowerPrice: number;
}

interface Event {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  price: string;
  artists: string[];
  venue: string;
  logo: string;
  logoImage?: string;
  image?: string;
  gradientColors: string[];
}

interface City {
  id: number;
  name: string;
  image?: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [userName, setUserName] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isChangingCity, setIsChangingCity] = useState(false);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Obtener nombre del usuario (solo el primer nombre)
        const user = await getUserData();
        if (user) {
          const firstName = user.name.split(" ")[0];
          setUserName(firstName);
        }

        // Obtener ciudad seleccionada
        const city = await getSelectedCity();
        if (city) {
          setSelectedCity(city.name);
          setSelectedCityId(city.id);

          // Obtener eventos del API
          try {
            const response = await api.get(
              `/events/search?search=${encodeURIComponent(city.name)}`
            );
            const apiEvents: ApiEvent[] = response.data;

            // Mapear eventos del API al formato de la UI
            const mappedEvents: Event[] = apiEvents.map((event, index) => {
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
              const formattedDate = `${eventDate.getDate()} de ${
                months[eventDate.getMonth()]
              }`;

              // Formatear hora
              const timeParts = event.time.split(":");
              const hour = parseInt(timeParts[0]);
              const minute = timeParts[1];
              const period = hour >= 12 ? "p.m" : "a.m";
              const formattedHour =
                hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
              const formattedTime = `${formattedHour}:${minute} ${period}`;

              // Formatear precio
              const formattedPrice = `Desde $${Math.round(
                event.lowerPrice
              ).toLocaleString("es-CO")}`;

              // Obtener artistas de los promoters
              const artists = event.promoters.map((p) => p.name.toUpperCase());

              return {
                id: event.id.toString(),
                title: event.name.toUpperCase(),
                subtitle: event.name,
                date: formattedDate,
                time: formattedTime,
                price: formattedPrice,
                artists:
                  artists.length > 0
                    ? artists
                    : [event.organizerEvent.name.toUpperCase()],
                venue: event.organizerEvent.name.toUpperCase(),
                logo: event.organizerEvent.name.toUpperCase(),
                logoImage: event.organizerEvent.picture,
                image: event.img,
                gradientColors: ["#FF8C42", "#FFB347", "#FFD700"],
              };
            });

            setEvents(mappedEvents);
          } catch (error: any) {
            console.error("Error al cargar eventos:", error);
            Alert.alert(
              "Error",
              "No se pudieron cargar los eventos. Por favor, intenta de nuevo.",
              [{ text: "OK" }]
            );
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleOpenCityModal = async () => {
    try {
      setIsLoadingCities(true);

      // Resetear animaciones antes de abrir
      slideAnim.setValue(Dimensions.get("window").height);
      opacityAnim.setValue(0);

      setIsCityModalVisible(true);

      // Cargar ciudades si no están cargadas
      if (cities.length === 0) {
        const response = await api.get("/events/cities");
        const citiesData: City[] = response.data;
        setCities(citiesData);
      }

      // Asegurar que la ciudad actual esté seleccionada
      if (!selectedCityId) {
        const currentCity = await getSelectedCity();
        if (currentCity) {
          setSelectedCityId(currentCity.id);
        }
      }

      // Animar el modal al abrir después de un pequeño delay para que el modal se renderice
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);
    } catch (error: any) {
      console.error("Error al cargar ciudades:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar las ciudades. Por favor, intenta de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleCloseCityModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsCityModalVisible(false);
    });
  };

  const handleChangeCity = async (cityId: number) => {
    // Si es la misma ciudad, no hacer nada
    if (selectedCityId === cityId) {
      return;
    }

    try {
      setIsChangingCity(true);
      const cityToSave = cities.find((city) => city.id === cityId);

      if (cityToSave) {
        // Intentar actualizar la ciudad en el backend si existe el endpoint
        try {
          await api.put("/user/city", { cityId: cityToSave.id }).catch(() => {
            // Si falla, continuar de todas formas (el endpoint puede no existir)
          });
        } catch (error) {
          // Ignorar errores del endpoint, continuar con el guardado local
        }

        // Guardar la ciudad seleccionada en AsyncStorage
        await saveSelectedCity({
          id: cityToSave.id,
          name: cityToSave.name,
        });

        // Actualizar el estado local
        setSelectedCity(cityToSave.name);
        setSelectedCityId(cityToSave.id);

        // Cerrar el modal con animación
        handleCloseCityModal();

        // Recargar eventos para la nueva ciudad
        try {
          setIsLoading(true);
          const response = await api.get(
            `/events/search?search=${encodeURIComponent(cityToSave.name)}`
          );
          const apiEvents: ApiEvent[] = response.data;

          const mappedEvents: Event[] = apiEvents.map((event) => {
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
            const formattedDate = `${eventDate.getDate()} de ${
              months[eventDate.getMonth()]
            }`;

            const timeParts = event.time.split(":");
            const hour = parseInt(timeParts[0]);
            const minute = timeParts[1];
            const period = hour >= 12 ? "p.m" : "a.m";
            const formattedHour =
              hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const formattedTime = `${formattedHour}:${minute} ${period}`;

            const formattedPrice = `Desde $${Math.round(
              event.lowerPrice
            ).toLocaleString("es-CO")}`;
            const artists = event.promoters.map((p) => p.name.toUpperCase());

            return {
              id: event.id.toString(),
              title: event.name.toUpperCase(),
              subtitle: event.name,
              date: formattedDate,
              time: formattedTime,
              price: formattedPrice,
              artists:
                artists.length > 0
                  ? artists
                  : [event.organizerEvent.name.toUpperCase()],
              venue: event.organizerEvent.name.toUpperCase(),
              logo: event.organizerEvent.name.toUpperCase(),
              logoImage: event.organizerEvent.picture,
              image: event.img,
              gradientColors: ["#FF8C42", "#FFB347", "#FFD700"],
            };
          });

          setEvents(mappedEvents);
        } catch (error: any) {
          console.error("Error al cargar eventos:", error);
          Alert.alert(
            "Error",
            "No se pudieron cargar los eventos. Por favor, intenta de nuevo.",
            [{ text: "OK" }]
          );
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Error al cambiar la ciudad:", error);
      Alert.alert(
        "Error",
        "No se pudo cambiar la ciudad. Por favor, intenta de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setIsChangingCity(false);
    }
  };

  const openEventDetail = (event: Event) => {
    router.push({
      pathname: "/(users)/event/[id]",
      params: {
        id: event.id,
        title: event.title,
        subtitle: event.subtitle,
        date: event.date,
        time: event.time,
        price: event.price,
        venue: event.venue,
        image: event.image || "",
        logoImage: event.logoImage || "",
        city: selectedCity || "",
      },
    });
  };

  const renderEventCard = (event: Event) => {
    return (
      <TouchableOpacity
        key={event.id}
        activeOpacity={0.9}
        onPress={() => openEventDetail(event)}
      >
        <LinearGradient
          colors={event.gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.eventCard}
        >
          {/* Badge de precio */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{event.price}</Text>
          </View>

          {/* Imagen de fondo del evento */}
          {event.image && (
            <Image
              source={{ uri: event.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          )}

          {/* Overlay con gradiente: transparente arriba (70%), oscuro abajo */}
          <LinearGradient
            colors={[
              "rgba(0, 0, 0, 0)",
              "rgba(0, 0, 0, 0)",
              "rgba(0, 0, 0, 0.6)",
            ]}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Footer del card */}
          <View style={styles.eventFooter}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
              <Text style={styles.eventDateTime}>
                {event.date} {event.time}
              </Text>
            </View>
            <View style={styles.logoContainer}>
              {event.logoImage ? (
                <Image
                  source={{ uri: event.logoImage }}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              ) : (
                <Text style={styles.logoText}>{event.logo}</Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hola {userName || "Usuario"}!</Text>
            <Text style={styles.waveEmoji}>👋</Text>
          </View>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleOpenCityModal}
          >
            <Ionicons name="location-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Lista de eventos */}
        {events.length > 0 ? (
          <View style={styles.eventsContainer}>
            {events.map((event) => renderEventCard(event))}
          </View>
        ) : (
          <View style={styles.soonContainer}>
            <Text style={styles.soonTitle}>Muy pronto{"\n"}estaremos aquí</Text>
            <Text style={styles.soonSubtitle}>
              Estamos trabajando por estar pronto en esta ciudad. 🥰
            </Text>
          </View>
        )}
      </ScrollView>

      {/* View absoluto para cambiar ciudad */}
      {isCityModalVisible && (
        <>
          {/* Overlay con blur y fondo negro transparente */}
          <Animated.View
            style={[styles.modalOverlay, { opacity: opacityAnim }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={handleCloseCityModal}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <BlurView
              intensity={50}
              tint="dark"
              style={StyleSheet.absoluteFill}
            >
              <View style={styles.blurOverlay} />
            </BlurView>
            <View style={styles.modalContent}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cambiar ciudad</Text>
                <TouchableOpacity
                  onPress={handleCloseCityModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Lista de ciudades */}
              {isLoadingCities ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#9333EA" />
                  <Text style={styles.modalLoadingText}>
                    Cargando ciudades...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.citiesScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {cities.map((city) => {
                    const isSelected = selectedCityId === city.id;

                    return (
                      <TouchableOpacity
                        key={city.id}
                        style={[styles.cityRow]}
                        onPress={() => handleChangeCity(city.id)}
                        activeOpacity={0.7}
                        disabled={isChangingCity}
                      >
                        {/* Imagen circular de la ciudad */}
                        <View style={styles.cityRowImageContainer}>
                          {city.image ? (
                            <Image
                              source={{ uri: city.image }}
                              style={styles.cityRowImage}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={styles.cityRowImagePlaceholder}>
                              <Text style={styles.cityRowInitial}>
                                {city.name.charAt(0)}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Nombre de la ciudad */}
                        <Text style={styles.cityRowName}>{city.name}</Text>

                        {/* Radio button */}
                        <View
                          style={[
                            styles.radioButton,
                            isSelected && styles.radioButtonSelected,
                          ]}
                        >
                          {isSelected && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </Animated.View>
        </>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    opacity: 0.6,
  },
  soonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 12,
    minHeight: SCREEN_HEIGHT * 0.5,
    marginTop: SCREEN_HEIGHT * 0.1,
  },
  soonTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    textAlign: "center",
  },
  soonSubtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.85,
    maxWidth: 360,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  waveEmoji: {
    fontSize: 24,
  },
  locationButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  eventsContainer: {
    gap: 20,
  },
  eventCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 280,
    overflow: "hidden",
    position: "relative",
  },
  priceBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#9333EA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  eventContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  artistsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  artistName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    opacity: 0.9,
  },
  eventTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FF0000",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
    paddingTop: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  eventDateTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    opacity: 0.8,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  logoText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25, 25, 25, 0.48)",
  },
  modalContainer: {
    position: "absolute",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    top: "30%",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 1001,
    elevation: 1001,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "transparent",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0)",
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalLoadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 16,
  },
  modalLoadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    opacity: 0.7,
  },
  citiesScrollView: {
    flex: 1,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  cityRowImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginRight: 12,
  },
  cityRowImage: {
    width: "100%",
    height: "100%",
  },
  cityRowImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
  },
  cityRowInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cityRowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: "#9333EA",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#9333EA",
  },
});
