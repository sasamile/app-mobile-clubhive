import { FloatingTabBar } from "@/components/navigation/floating-tab-bar";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const theme = useDiscoverTheme();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "none",
        freezeOnBlur: false,
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="explorar" options={{ title: "Explorar" }} />
      <Tabs.Screen name="entradas" options={{ title: "Entradas" }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
