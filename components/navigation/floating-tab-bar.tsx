import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }
> = {
  index: { label: "Inicio", icon: "home-outline", active: "home" },
  explorar: { label: "Explorar", icon: "search-outline", active: "search" },
  entradas: { label: "Entradas", icon: "ticket-outline", active: "ticket" },
  perfil: { label: "Perfil", icon: "person-outline", active: "person" },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useDiscoverTheme();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const meta = ICONS[route.name] ?? {
            label: route.name,
            icon: "ellipse-outline" as const,
            active: "ellipse" as const,
          };
          const focused = state.index === index;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (process.env.EXPO_OS === "ios") {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={[
                styles.item,
                focused && { backgroundColor: theme.accent },
              ]}
            >
              <Ionicons
                name={focused ? meta.active : meta.icon}
                size={18}
                color={focused ? "#FFFFFF" : theme.tabInactive}
              />
              <Text
                style={[
                  styles.label,
                  { color: focused ? "#FFFFFF" : theme.tabInactive },
                ]}
                numberOfLines={1}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 18,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 2,
    width: "100%",
    maxWidth: 440,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#0A0A0A",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    ...Platform.select({
      android: { elevation: 10 },
    }),
  },
  item: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
