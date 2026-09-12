import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function HomeStack() {
  const theme = useDiscoverTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
    </View>
  );
}
