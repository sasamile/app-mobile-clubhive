import { CategoryRow } from "@/components/discover/category-row";
import { EmptyEvents } from "@/components/discover/empty-events";
import {
  EventGrid,
  EventGridSkeleton,
  EventRail,
} from "@/components/discover/event-grid";
import { FilterModal } from "@/components/discover/filter-sheet";
import { ScreenAtmosphere } from "@/components/discover/screen-atmosphere";
import { SearchBar } from "@/components/discover/search-bar";
import { SectionHeader } from "@/components/discover/section-header";
import { Discover, FLOATING_TAB_INSET, type Category } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import {
  filterEvents,
  isThisWeekend,
  uniqueById,
  type DateFilter,
  type PriceFilter,
} from "@/lib/discover-events";
import {
  useDiscoverEvents,
  useSavedEvents,
} from "@/hooks/use-discover-events";
import { getUserData } from "@/lib/storage";
import { resolveProfileImage } from "@/lib/user-profile";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();
  const { events, isLoading } = useDiscoverEvents();
  const { savedIds, toggleSave } = useSavedEvents();
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("Todos");
  const [price, setPrice] = useState<PriceFilter>("todos");
  const [date, setDate] = useState<DateFilter>("todos");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const user = await getUserData();
        if (!user) return;
        setUserName(user.name.split(" ")[0]);
        setAvatarUrl(await resolveProfileImage(user));
      })();
    }, [])
  );

  const filtered = useMemo(
    () => filterEvents(events, { query, category, price, date }),
    [events, query, category, price, date]
  );

  const featured = filtered.slice(0, 4);
  const featuredIds = useMemo(
    () => new Set(featured.map((event) => event.id)),
    [featured]
  );
  const weekend = uniqueById(
    filtered.filter((event) => isThisWeekend(event.dateRaw)),
    featuredIds
  ).slice(0, 6);
  const nearby = uniqueById(filtered, featuredIds).slice(0, 4);
  const popular = uniqueById([...filtered].reverse(), featuredIds).slice(0, 4);

  const openEvent = (id: string) => {
    router.push({ pathname: "/(users)/event/[id]", params: { id } });
  };

  const openExplore = (nextCategory: Category = category) => {
    router.push({
      pathname: "/(users)/(tabs)/explorar",
      params: {
        category: nextCategory,
        q: query,
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={theme.statusBar} />
      <ScreenAtmosphere />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: FLOATING_TAB_INSET + insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.hello, { color: theme.ink }]}>
              HEY {userName ? userName.toUpperCase() : "TÚ"}! 👋
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Descubre qué está pasando cerca de ti.
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[
                styles.iconBtn,
                { backgroundColor: theme.surface, borderColor: theme.line },
              ]}
              accessibilityLabel="Notificaciones"
            >
              <Ionicons name="notifications-outline" size={18} color={theme.ink} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(users)/(tabs)/perfil")}
              style={[styles.avatarWrap, { borderColor: theme.line }]}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={[styles.avatar, { backgroundColor: theme.chip }]}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarFallback,
                    { backgroundColor: theme.accent },
                  ]}
                >
                  <Text style={styles.avatarLetter}>
                    {(userName || "T").slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          filterActive={price !== "todos" || date !== "todos"}
          onFilterPress={() => setFiltersOpen(true)}
        />

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

        {isLoading && events.length === 0 ? (
          <EventGridSkeleton />
        ) : featured.length === 0 ? (
          <EmptyEvents />
        ) : (
          <>
            <SectionHeader
              title="Eventos destacados"
              onAction={() => openExplore()}
            />
            <EventGrid
              events={featured}
              savedIds={savedIds}
              showCategory
              onPress={openEvent}
              onSave={toggleSave}
            />

            {weekend.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Este fin de semana" />
                <EventRail
                  events={weekend}
                  savedIds={savedIds}
                  onPress={openEvent}
                  onSave={toggleSave}
                />
              </View>
            ) : null}

            {nearby.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Cerca de ti" />
                <EventGrid
                  events={nearby}
                  savedIds={savedIds}
                  onPress={openEvent}
                  onSave={toggleSave}
                />
              </View>
            ) : null}

            {popular.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Populares" />
                <EventGrid
                  events={popular}
                  savedIds={savedIds}
                  onPress={openEvent}
                  onSave={toggleSave}
                />
              </View>
            ) : null}
          </>
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  hello: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  cats: {
    marginTop: 16,
    marginBottom: 22,
  },
  section: {
    marginTop: 28,
  },
});
