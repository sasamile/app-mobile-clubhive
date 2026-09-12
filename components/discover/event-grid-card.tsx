import { Discover } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import type { DiscoverEvent } from "@/lib/discover-events";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type EventGridCardProps = {
  event: DiscoverEvent;
  saved?: boolean;
  showCategory?: boolean;
  onPress: () => void;
  onSave: () => void;
};

export function EventGridCard({
  event,
  saved,
  showCategory,
  onPress,
  onSave,
}: EventGridCardProps) {
  const theme = useDiscoverTheme();
  const dark = theme.statusBar === "light";
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const meta = [event.dateShort, event.price].filter(Boolean).join("  ·  ");

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 120 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 180 });
        }}
        style={styles.card}
      >
        <View style={[styles.photo, { backgroundColor: theme.chip }]}>
          {event.image ? (
            <Image
              source={{ uri: event.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="top"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.chip }]} />
          )}

          {showCategory ? (
            <BlurView
              intensity={dark ? 40 : 50}
              tint={dark ? "dark" : "light"}
              style={styles.badge}
            >
              <Text style={[styles.badgeText, { color: dark ? "#FFFFFF" : "#0A0A0A" }]}>
                {event.category}
              </Text>
            </BlurView>
          ) : null}

          <Pressable
            onPress={onSave}
            hitSlop={8}
            style={styles.heart}
            accessibilityLabel="Guardar evento"
          >
            <BlurView
              intensity={40}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={14}
              color={saved ? "#FF3B5C" : "#FFFFFF"}
            />
          </Pressable>

          <BlurView
            intensity={dark ? 48 : 36}
            tint={dark ? "dark" : "light"}
            style={styles.glass}
          >
            <Text
              style={[styles.title, { color: dark ? "#FFFFFF" : theme.ink }]}
              numberOfLines={1}
            >
              {event.name}
            </Text>
            {meta ? (
              <Text
                style={[styles.meta, { color: dark ? "rgba(255,255,255,0.78)" : theme.muted }]}
                numberOfLines={1}
              >
                {meta}
              </Text>
            ) : null}
          </BlurView>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Discover.radius.card,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 5,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  badge: {
    position: "absolute",
    left: 8,
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  heart: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  glass: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  meta: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
  },
});
