import { Discover } from "@/constants/discover";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  filterActive?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  filterActive,
  placeholder = "Buscar eventos, artistas o lugares",
  autoFocus,
}: SearchBarProps) {
  const theme = useDiscoverTheme();

  return (
    <View
      style={[
        styles.search,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={theme.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        style={[styles.input, { color: theme.ink }]}
        returnKeyType="search"
        autoFocus={autoFocus}
      />
      <Pressable
        onPress={onFilterPress}
        style={[
          styles.filterBtn,
          {
            backgroundColor: filterActive ? theme.accent : theme.surfaceMuted,
          },
        ]}
        accessibilityLabel="Filtros"
      >
        <Ionicons
          name="options-outline"
          size={18}
          color={filterActive ? "#FFFFFF" : theme.ink}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 50,
    borderRadius: Discover.radius.search,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 6,
    gap: 8,
    shadowColor: "#0A0A0A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
