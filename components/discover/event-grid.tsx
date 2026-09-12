import { Discover } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import type { DiscoverEvent } from "@/lib/discover-events";
import { ScrollView, StyleSheet, View } from "react-native";

import { EventGridCard } from "./event-grid-card";

type EventGridProps = {
  events: DiscoverEvent[];
  savedIds: Set<string>;
  showCategory?: boolean;
  onPress: (id: string) => void;
  onSave: (id: string) => void;
};

export function EventGrid({
  events,
  savedIds,
  showCategory,
  onPress,
  onSave,
}: EventGridProps) {
  return (
    <View style={styles.grid}>
      {events.map((event) => (
        <View key={event.id} style={styles.item}>
          <EventGridCard
            event={event}
            saved={savedIds.has(event.id)}
            showCategory={showCategory}
            onPress={() => onPress(event.id)}
            onSave={() => onSave(event.id)}
          />
        </View>
      ))}
    </View>
  );
}

export function EventRail({
  events,
  savedIds,
  onPress,
  onSave,
}: EventGridProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {events.map((event) => (
        <View key={event.id} style={styles.railItem}>
          <EventGridCard
            event={event}
            saved={savedIds.has(event.id)}
            onPress={() => onPress(event.id)}
            onSave={() => onSave(event.id)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

export function EventGridSkeleton({ count = 4 }: { count?: number }) {
  const theme = useDiscoverTheme();
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.skelCard}>
            <View style={[styles.skelPhoto, { backgroundColor: theme.chip }]} />
            <View style={[styles.skelLine, { backgroundColor: theme.chip }]} />
            <View style={[styles.skelLineShort, { backgroundColor: theme.chip }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  item: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  rail: {
    gap: 12,
    paddingRight: 8,
  },
  railItem: {
    width: 158,
  },
  skelCard: {
    borderRadius: Discover.radius.card,
    overflow: "hidden",
  },
  skelPhoto: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: Discover.radius.card,
  },
  skelLine: {
    height: 12,
    borderRadius: 6,
    marginTop: 10,
    marginHorizontal: 4,
    width: "86%",
  },
  skelLineShort: {
    height: 10,
    borderRadius: 6,
    marginTop: 8,
    marginHorizontal: 4,
    width: "48%",
  },
});
