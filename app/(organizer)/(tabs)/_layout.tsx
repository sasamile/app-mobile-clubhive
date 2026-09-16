import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#7C4DFF";

const ICONS: Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    active: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { label: "Eventos", icon: "calendar-outline", active: "calendar" },
  perfil: { label: "Perfil", icon: "person-outline", active: "person" },
};

function OrganizerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.bar}>
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
              style={[styles.item, focused && styles.itemActive]}
            >
              <Ionicons
                name={focused ? meta.active : meta.icon}
                size={18}
                color={focused ? "#FFFFFF" : "rgba(255,255,255,0.55)"}
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
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

export default function OrganizerTabs() {
  return (
    <Tabs
      tabBar={(props) => <OrganizerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "none",
        sceneStyle: { backgroundColor: "#000000" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Eventos" }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
    </Tabs>
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
    backgroundColor: "#141414",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 10 },
    }),
  },
  item: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  itemActive: {
    backgroundColor: ACCENT,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
