import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

export const ORG_ACCENT = "#7C4DFF";
export const ORG_BG = "#000000";
export const ORG_FIELD = "#141414";
export const ORG_MUTED = "#AAAAAA";

export function OrgBack({
  onPress,
  label,
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.back} hitSlop={8}>
      <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
      {label ? <Text style={styles.backLabel}>{label}</Text> : null}
    </Pressable>
  );
}

export function OrgField({
  label,
  inputProps,
  trailing,
  leading,
}: {
  label: string;
  inputProps: TextInputProps;
  trailing?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        {leading}
        <TextInput
          placeholderTextColor="#6B6B6B"
          {...inputProps}
          style={styles.input}
        />
        {trailing}
      </View>
    </View>
  );
}

export function OrgPrimary({
  title,
  onPress,
  busy,
  disabled,
  fullWidth,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      style={[
        styles.primary,
        fullWidth && styles.primaryFull,
        (busy || disabled) && styles.primaryDisabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.primaryText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function OrgProgress({ step }: { step: 1 | 2 }) {
  return (
    <View style={styles.progress}>
      <View style={[styles.bar, step >= 1 && styles.barActive]} />
      <View style={[styles.bar, step >= 2 && styles.barActive]} />
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: "flex-start",
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    paddingRight: 4,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: ORG_FIELD,
    paddingHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    paddingVertical: 14,
  },
  primary: {
    minHeight: 52,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: ORG_ACCENT,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  primaryFull: {
    alignSelf: "stretch",
  },
  primaryDisabled: {
    opacity: 0.55,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  progress: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
  },
  bar: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#1F1F1F",
  },
  barActive: {
    backgroundColor: ORG_ACCENT,
  },
});
