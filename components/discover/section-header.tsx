import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  actionLabel = "Ver todos",
  onAction,
}: SectionHeaderProps) {
  const theme = useDiscoverTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: theme.accent }]}>
            {actionLabel} →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  action: {
    fontSize: 14,
    fontWeight: "600",
  },
});
