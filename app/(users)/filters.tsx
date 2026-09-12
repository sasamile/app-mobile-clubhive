import { FilterForm } from "@/components/discover/filter-sheet";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import {
  closeFilterSheet,
  discardFilterSheet,
  readFilterDraft,
} from "@/lib/filter-bridge";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function FiltersScreen() {
  const theme = useDiscoverTheme();
  const initial = readFilterDraft();
  const [price, setPrice] = useState(initial.price);
  const [date, setDate] = useState(initial.date);

  useEffect(() => {
    return () => {
      discardFilterSheet();
    };
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.52],
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
      <FilterForm
        compact
        price={price}
        date={date}
        onChangePrice={setPrice}
        onChangeDate={setDate}
        onCancel={() => closeFilterSheet()}
        onDone={() => closeFilterSheet({ price, date })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 12,
  },
});
