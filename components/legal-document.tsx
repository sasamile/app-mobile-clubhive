import type { LegalSection } from "@/lib/legal-content";
import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type LegalDocumentProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalDocument({
  title,
  updated,
  intro,
  sections,
}: LegalDocumentProps) {
  const theme = useDiscoverTheme();
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: theme.muted }]}>{updated}</Text>
        <Text style={[styles.intro, { color: theme.ink }]}>{intro}</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.block}>
            <Text style={[styles.heading, { color: theme.ink }]}>{section.title}</Text>
            <Text style={[styles.body, { color: theme.muted }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 22,
  },
  updated: {
    fontSize: 13,
    fontWeight: "500",
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
  },
  block: {
    gap: 8,
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
});
