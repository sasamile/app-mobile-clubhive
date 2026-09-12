import { CategoryRow } from "@/components/discover/category-row";
import { EmptyEvents } from "@/components/discover/empty-events";
import {
  EventList,
  EventListSkeleton,
} from "@/components/discover/event-list-card";
import { FilterModal } from "@/components/discover/filter-sheet";
import { ScreenAtmosphere } from "@/components/discover/screen-atmosphere";
import { SearchBar } from "@/components/discover/search-bar";
import {
  Discover,
  FLOATING_TAB_INSET,
  type Category,
} from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { filterEvents, type DateFilter, type PriceFilter } from "@/lib/discover-events";
import { useDiscoverEvents } from "@/hooks/use-discover-events";
import { StatusBar } from "expo-status-bar";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function asCategory(value: string | undefined): Category {
  if (
    value === "Música" ||
    value === "Festivales" ||
    value === "Gastronomía" ||
    value === "Negocios" ||
    value === "Deportes" ||
    value === "Todos"
  ) {
    return value;
  }
  return "Todos";
}

export default function ExplorarScreen() {
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();
  const params = useLocalSearchParams<{ category?: string; q?: string }>();
  const { events, isLoading, cityName } = useDiscoverEvents();
  const [query, setQuery] = useState(params.q ?? "");
  const [category, setCategory] = useState<Category>(asCategory(params.category));
  const [price, setPrice] = useState<PriceFilter>("todos");
  const [date, setDate] = useState<DateFilter>("todos");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (typeof params.q === "string") setQuery(params.q);
    if (params.category) setCategory(asCategory(params.category));
  }, [params.q, params.category]);

  const filtered = useMemo(
    () => filterEvents(events, { query, category, price, date }),
    [events, query, category, price, date]
  );

  const openEvent = (id: string) => {
    router.push({ pathname: "/(users)/event/[id]", params: { id } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={theme.statusBar} />
      <ScreenAtmosphere height={260} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: FLOATING_TAB_INSET + insets.bottom,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.ink }]}>Explorar</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {cityName
            ? `Todo el catálogo en ${cityName}`
            : "Descubre eventos, artistas y lugares"}
        </Text>

        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            filterActive={price !== "todos" || date !== "todos"}
            onFilterPress={() => setFiltersOpen(true)}
          />
        </View>

        <FilterModal
          visible={filtersOpen}
          price={price}
          date={date}
          onClose={() => setFiltersOpen(false)}
          onApply={(nextPrice, nextDate) => {
            setPrice(nextPrice);
            setDate(nextDate);
            setFiltersOpen(false);
          }}
        />

        <View style={styles.cats}>
          <CategoryRow selected={category} onSelect={setCategory} />
        </View>

        <View style={styles.collectionHead}>
          <Text style={[styles.collectionTitle, { color: theme.ink }]}>
            Eventos
          </Text>
          <Text style={[styles.collectionMeta, { color: theme.muted }]}>
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </Text>
        </View>

        {isLoading && events.length === 0 ? (
          <EventListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyEvents
            title="Sin resultados"
            copy="Prueba con otra búsqueda, categoría o quita algunos filtros."
          />
        ) : (
          <EventList events={filtered} onPress={openEvent} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Discover.pad,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 15,
    fontWeight: "500",
  },
  searchWrap: {
    marginBottom: 14,
  },
  cats: {
    marginBottom: 18,
  },
  collectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  collectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  collectionMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
});
