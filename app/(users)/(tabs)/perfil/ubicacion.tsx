import { CityList } from "@/components/discover/city-list";
import { ScreenAtmosphere } from "@/components/discover/screen-atmosphere";
import { Discover, FLOATING_TAB_INSET } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import {
  fetchCatalogCities,
  openLocationSettings,
  resolveCityFromLocation,
  type CatalogCity,
} from "@/lib/resolve-city";
import { getSelectedCity, saveSelectedCity } from "@/lib/storage";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UbicacionScreen() {
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();
  const [cities, setCities] = useState<CatalogCity[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [saved, catalog] = await Promise.all([
          getSelectedCity(),
          fetchCatalogCities(),
        ]);
        setCities(catalog);
        setSelectedCityId(saved?.id ?? null);
      } catch {
        Alert.alert("Error", "No se pudieron cargar las ciudades.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const applyLocatedCity = async () => {
    try {
      setIsChanging(true);
      const located = await resolveCityFromLocation();
      if (!located.ok) {
        if (located.reason === "denied") {
          Alert.alert(
            "Ubicación desactivada",
            "Activa la ubicación de Tiked en Ajustes para detectar tu ciudad.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Abrir Ajustes", onPress: () => void openLocationSettings() },
            ]
          );
          return;
        }
        Alert.alert(
          "Ubicación",
          located.reason === "unavailable"
            ? "La ubicación no está disponible en este dispositivo."
            : "No pudimos detectar tu ciudad. Elige una de la lista."
        );
        return;
      }
      setSelectedCityId(located.city.id);
      Alert.alert(
        "Ciudad actualizada",
        `Te mostraremos eventos en ${located.city.name}.`
      );
    } catch {
      Alert.alert("Ubicación", "Activa el GPS para detectar tu ciudad.");
    } finally {
      setIsChanging(false);
    }
  };

  const handleUseMyLocation = () => {
    Alert.alert(
      "Permitir ubicación",
      "Tiked necesita acceder a tu ubicación para mostrarte los eventos que hay cerca de ti.",
      [
        { text: "Ahora no", style: "cancel" },
        { text: "Permitir", onPress: () => void applyLocatedCity() },
      ]
    );
  };

  const handleChangeCity = async (cityId: number) => {
    if (selectedCityId === cityId) return;
    try {
      setIsChanging(true);
      const cityToSave = cities.find((city) => city.id === cityId);
      if (!cityToSave) return;
      await saveSelectedCity({ id: cityToSave.id, name: cityToSave.name });
      setSelectedCityId(cityToSave.id);
    } catch {
      Alert.alert("Error", "No se pudo cambiar la ciudad.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingBottom: FLOATING_TAB_INSET + insets.bottom,
          backgroundColor: theme.bg,
        },
      ]}
    >
      <Stack.Screen options={{ title: "Ubicación" }} />
      <StatusBar style={theme.statusBar} />
      <ScreenAtmosphere height={180} />
      <Text style={[styles.lead, { color: theme.muted }]}>
        Elige la ciudad para recomendaciones y el catálogo de eventos.
      </Text>
      <CityList
        cities={cities}
        selectedCityId={selectedCityId}
        isLoading={isLoading}
        isChanging={isChanging}
        onUseLocation={handleUseMyLocation}
        onSelect={handleChangeCity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Discover.pad,
  },
  lead: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 16,
  },
});
