import { DisplayFont, Discover } from "@/constants/discover";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

type FeaturedEventCardProps = {
  title: string;
  category: string;
  dateShort: string;
  venue: string;
  price: string;
  image?: string;
  saved?: boolean;
  onPress: () => void;
  onSave: () => void;
};

export function FeaturedEventCard({
  title,
  category,
  dateShort,
  venue,
  price,
  image,
  saved,
  onPress,
  onSave,
}: FeaturedEventCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
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
      <LinearGradient
        colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.72)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{category.toUpperCase()}</Text>
        </View>
        <Pressable
          onPress={onSave}
          hitSlop={8}
          style={styles.heart}
          accessibilityLabel="Guardar evento"
        >
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={18}
            color={saved ? "#FF3B5C" : "#FFFFFF"}
          />
        </Pressable>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {dateShort ? `📅  ${dateShort}` : ""}
            {dateShort && venue ? "    " : ""}
            {venue ? `📍  ${venue}` : ""}
          </Text>
        </View>
        {price ? <Text style={styles.price}>{price}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 300,
    borderRadius: Discover.radius.card,
    overflow: "hidden",
    backgroundColor: "#1A1228",
    justifyContent: "space-between",
    padding: 16,
  },
  fallback: {
    backgroundColor: "#1A1228",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Discover.radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#111111",
  },
  heart: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: 8,
  },
  title: {
    fontFamily: DisplayFont,
    fontSize: 34,
    lineHeight: 36,
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
  },
  meta: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
