import { DisplayFont, Discover } from "@/constants/discover";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type UpcomingEventCardProps = {
  title: string;
  dateShort: string;
  venue: string;
  time: string;
  price: string;
  image?: string;
  saved?: boolean;
  onPress: () => void;
  onSave: () => void;
};

export function UpcomingEventCard({
  title,
  dateShort,
  venue,
  time,
  price,
  image,
  saved,
  onPress,
  onSave,
}: UpcomingEventCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={styles.photo}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]} />
        )}
        {dateShort ? (
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{dateShort}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={onSave}
          hitSlop={8}
          style={styles.heart}
          accessibilityLabel="Guardar evento"
        >
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={16}
            color={saved ? "#FF3B5C" : "#FFFFFF"}
          />
        </Pressable>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {venue ? (
        <Text style={styles.meta} numberOfLines={1}>
          📍 {venue}
        </Text>
      ) : null}
      {time ? <Text style={styles.meta}>{time}</Text> : null}
      {price ? <Text style={styles.price}>{price}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: 8,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: Discover.radius.card,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  fallback: {
    backgroundColor: "#1C1C1E",
  },
  dateBadge: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#111111",
  },
  heart: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.32)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: DisplayFont,
    fontSize: 16,
    lineHeight: 18,
    color: Discover.ink,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: "500",
    color: Discover.muted,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: Discover.ink,
    marginTop: 2,
  },
});
