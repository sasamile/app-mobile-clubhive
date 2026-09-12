import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

type ScreenAtmosphereProps = {
  height?: number;
};

export function ScreenAtmosphere({ height = 340 }: ScreenAtmosphereProps) {
  const theme = useDiscoverTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[theme.sky, theme.skyMid, theme.washEnd, theme.bg]}
        locations={[0, 0.38, 0.72, 1]}
        style={[styles.wash, { height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
