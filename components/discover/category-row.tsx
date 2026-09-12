import { CATEGORIES, Discover, type Category } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

type CategoryRowProps = {
  selected: Category;
  onSelect: (category: Category) => void;
};

export function CategoryRow({ selected, onSelect }: CategoryRowProps) {
  const theme = useDiscoverTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((item) => {
        const active = item === selected;
        return (
          <Pressable
            key={item}
            onPress={() => onSelect(item)}
            style={[
              styles.chip,
              active && { backgroundColor: theme.accent, paddingHorizontal: 16 },
            ]}
          >
            <Text style={[styles.text, { color: active ? "#FFFFFF" : theme.ink }]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
    paddingRight: 8,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: Discover.radius.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
  },
});
