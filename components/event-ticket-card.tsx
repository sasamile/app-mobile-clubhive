import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Discover } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";

const BRAND = Discover.accent;
const NOTCH = 11;

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type EventTicketCardProps = {
  title: string;
  date: string;
  time?: string;
  price?: string;
  badge?: string;
  kicker?: string;
  venue?: string;
  image?: string;
  actionIcon?: IoniconsName;
  onPress: () => void;
};

export function EventTicketCard({
  title,
  date,
  time,
  price,
  badge,
  kicker = "Tiked",
  venue,
  image,
  actionIcon = "flash",
  onPress,
}: EventTicketCardProps) {
  const theme = useDiscoverTheme();
  const badgeLabel = badge ?? price;
  const meta = [date, time, venue].filter(Boolean).join(" · ");

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: theme.chip }]}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
          />
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker} numberOfLines={1}>
          {kicker}
        </Text>
        <Text style={[styles.title, { color: theme.ink }]} numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text style={[styles.meta, { color: theme.muted }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {badgeLabel ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : (
        <View style={styles.cta}>
          <Ionicons name={actionIcon} size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export function TicketNotches({ heroHeight }: { heroHeight: number }) {
  const theme = useDiscoverTheme();
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.notch,
          styles.notchLeft,
          { top: heroHeight + 11 - NOTCH, backgroundColor: theme.bg },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.notch,
          styles.notchRight,
          { top: heroHeight + 11 - NOTCH, backgroundColor: theme.bg },
        ]}
      />
    </>
  );
}

export function TicketPerforation() {
  const theme = useDiscoverTheme();
  return (
    <View
      style={[styles.perforation, { backgroundColor: theme.surface }]}
      pointerEvents="none"
    >
      <View style={styles.dashRow}>
        {Array.from({ length: 22 }).map((_, i) => (
          <View
            key={i}
            style={[styles.dash, { backgroundColor: theme.line }]}
          />
        ))}
      </View>
    </View>
  );
}

export function EventTicketCardSkeleton() {
  const theme = useDiscoverTheme();
  const pulse = useSharedValue(0.38);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.72, {
        duration: 900,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [pulse]);

  const boneStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando entrada"
    >
      <Animated.View
        style={[styles.thumb, { backgroundColor: theme.chip }, boneStyle]}
      />
      <View style={styles.copy}>
        <Animated.View
          style={[styles.skelKicker, { backgroundColor: theme.line }, boneStyle]}
        />
        <Animated.View
          style={[styles.skelTitle, { backgroundColor: theme.line }, boneStyle]}
        />
        <Animated.View
          style={[styles.skelMeta, { backgroundColor: theme.line }, boneStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    paddingRight: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: BRAND,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: BRAND,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  notch: {
    position: "absolute",
    width: NOTCH * 2,
    height: NOTCH * 2,
    borderRadius: NOTCH,
    zIndex: 2,
  },
  notchLeft: {
    left: -NOTCH,
  },
  notchRight: {
    right: -NOTCH,
  },
  perforation: {
    height: 22,
    justifyContent: "center",
  },
  dashRow: {
    flexDirection: "row",
    justifyContent: "center",
    overflow: "hidden",
    marginHorizontal: 22,
    gap: 5,
  },
  dash: {
    width: 7,
    height: 1.5,
    borderRadius: 1,
  },
  skelKicker: {
    width: 56,
    height: 8,
    borderRadius: 4,
  },
  skelTitle: {
    width: "78%",
    height: 12,
    borderRadius: 5,
  },
  skelMeta: {
    width: "48%",
    height: 10,
    borderRadius: 5,
  },
});
