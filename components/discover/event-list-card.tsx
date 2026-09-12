import { Discover } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import type { DiscoverEvent } from "@/lib/discover-events";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type EventListCardProps = {
  event: DiscoverEvent;
  onPress: () => void;
};

export function EventListCard({ event, onPress }: EventListCardProps) {
  const theme = useDiscoverTheme();
  const place = [event.venue, event.cityName]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join(" · ");
  const chip = [event.dateShort, event.price].filter(Boolean).join("  ·  ");

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
      ]}
    >
      {event.image ? (
        <Image
          source={{ uri: event.image }}
          style={styles.thumb}
          contentFit="cover"
          contentPosition="top"
        />
      ) : (
        <View style={[styles.thumb, { backgroundColor: theme.chip }]} />
      )}

      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.ink }]} numberOfLines={1}>
          {event.name}
        </Text>
        {place ? (
          <Text style={[styles.place, { color: theme.muted }]} numberOfLines={1}>
            {place}
          </Text>
        ) : null}
        {chip ? (
          <View style={[styles.chip, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.chipText, { color: theme.ink }]} numberOfLines={1}>
              {chip}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.cta, { backgroundColor: theme.accent }]}>
        <Text style={styles.ctaText}>Ver</Text>
      </View>
    </Pressable>
  );
}

export function EventList({
  events,
  onPress,
}: {
  events: DiscoverEvent[];
  onPress: (id: string) => void;
}) {
  return (
    <View style={styles.list}>
      {events.map((event) => (
        <EventListCard
          key={event.id}
          event={event}
          onPress={() => onPress(event.id)}
        />
      ))}
    </View>
  );
}

export function EventListSkeleton({ count = 6 }: { count?: number }) {
  const theme = useDiscoverTheme();

  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.line,
            },
          ]}
        >
          <View style={[styles.thumb, { backgroundColor: theme.chip }]} />
          <View style={styles.copy}>
            <View style={[styles.skelTitle, { backgroundColor: theme.chip }]} />
            <View style={[styles.skelMeta, { backgroundColor: theme.chip }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    paddingRight: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: Discover.chip,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  place: {
    fontSize: 12,
    fontWeight: "500",
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: "100%",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cta: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  skelTitle: {
    height: 14,
    width: "78%",
    borderRadius: 6,
  },
  skelMeta: {
    height: 10,
    width: "46%",
    borderRadius: 5,
  },
});
