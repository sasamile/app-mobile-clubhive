import { Stack } from "expo-router";

export default function OrganizerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: { backgroundColor: "#000000" },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="event/[id]"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
    </Stack>
  );
}
