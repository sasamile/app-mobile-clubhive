import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { StyleSheet, Text, View } from "react-native";

type EmptyEventsProps = {
  title?: string;
  copy?: string;
};

export function EmptyEvents({
  title = "Nada por aquí todavía",
  copy = "Estamos trabajando para llegar a esta ciudad.",
}: EmptyEventsProps) {
  const theme = useDiscoverTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      <Text style={[styles.copy, { color: theme.muted }]}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  copy: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});
