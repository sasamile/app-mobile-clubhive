import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { getCityDepartment } from "@/lib/colombia-departments";
import type { CatalogCity } from "@/lib/resolve-city";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type CityListProps = {
  cities: CatalogCity[];
  selectedCityId: number | null;
  isLoading?: boolean;
  isChanging?: boolean;
  onUseLocation: () => void;
  onSelect: (cityId: number) => void;
};

export function CityList({
  cities,
  selectedCityId,
  isLoading,
  isChanging,
  onUseLocation,
  onSelect,
}: CityListProps) {
  const theme = useDiscoverTheme();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onUseLocation}
        disabled={isChanging}
        style={[styles.gpsRow, { backgroundColor: theme.surfaceMuted }]}
      >
        <View style={[styles.gpsIcon, { backgroundColor: theme.surface }]}>
          <Ionicons name="navigate" size={16} color={theme.accent} />
        </View>
        <Text style={[styles.gpsText, { color: theme.ink }]}>Usar mi ubicación</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.muted} />
      </Pressable>

      {isLoading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 28 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {cities.map((city) => {
            const selected = selectedCityId === city.id;
            return (
              <Pressable
                key={city.id}
                onPress={() => onSelect(city.id)}
                disabled={isChanging}
                style={styles.cityRow}
              >
                <View style={[styles.cityIcon, { backgroundColor: theme.surfaceMuted }]}>
                  <Ionicons name="location-outline" size={18} color={theme.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cityName, { color: theme.ink }]}>{city.name}</Text>
                  <Text style={[styles.cityDept, { color: theme.muted }]}>
                    {getCityDepartment(city.name).department}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: selected ? theme.ink : theme.line },
                  ]}
                >
                  {selected ? (
                    <View style={[styles.radioDot, { backgroundColor: theme.ink }]} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
  },
  gpsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gpsText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  list: {
    paddingBottom: 32,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cityName: {
    fontSize: 16,
    fontWeight: "600",
  },
  cityDept: {
    fontSize: 13,
    marginTop: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
