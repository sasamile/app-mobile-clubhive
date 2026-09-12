import { useDiscoverTheme } from "@/hooks/use-discover-theme";
import type { DateFilter, PriceFilter } from "@/lib/discover-events";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type FilterFormProps = {
  price: PriceFilter;
  date: DateFilter;
  onChangePrice: (value: PriceFilter) => void;
  onChangeDate: (value: DateFilter) => void;
  onCancel: () => void;
  onDone: () => void;
  compact?: boolean;
};

const PRICE_OPTIONS: { id: PriceFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "gratis", label: "Gratis" },
  { id: "pago", label: "De pago" },
];

const DATE_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: "todos", label: "Todas las fechas" },
  { id: "hoy", label: "Hoy" },
  { id: "fin_de_semana", label: "Este fin de semana" },
  { id: "semana", label: "Próximos 7 días" },
];

export function FilterModal({
  visible,
  price,
  date,
  onClose,
  onApply,
}: {
  visible: boolean;
  price: PriceFilter;
  date: DateFilter;
  onClose: () => void;
  onApply: (price: PriceFilter, date: DateFilter) => void;
}) {
  const theme = useDiscoverTheme();
  const [draftPrice, setDraftPrice] = useState(price);
  const [draftDate, setDraftDate] = useState(date);

  useEffect(() => {
    if (!visible) return;
    setDraftPrice(price);
    setDraftDate(date);
  }, [visible, price, date]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "formSheet" : "fullScreen"}
      allowSwipeDismissal={Platform.OS === "ios"}
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}
        />
        <FilterForm
          compact
          price={draftPrice}
          date={draftDate}
          onChangePrice={setDraftPrice}
          onChangeDate={setDraftDate}
          onCancel={onClose}
          onDone={() => onApply(draftPrice, draftDate)}
        />
      </View>
    </Modal>
  );
}

export function FilterForm({
  price,
  date,
  onChangePrice,
  onChangeDate,
  onCancel,
  onDone,
  compact,
}: FilterFormProps) {
  const theme = useDiscoverTheme();

  return (
    <View style={[styles.form, { backgroundColor: theme.bg }]}>
      <View style={[styles.grabberWrap, !compact && styles.grabberHidden]}>
        <View style={[styles.grabber, { backgroundColor: theme.line }]} />
      </View>
      <View style={[styles.nav, { borderBottomColor: theme.line }]}>
        <Pressable onPress={onCancel} hitSlop={8} style={styles.navSide}>
          <Text style={[styles.navAction, { color: theme.accent }]}>
            Cancelar
          </Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.ink }]}>Filtros</Text>
        <Pressable
          onPress={onDone}
          hitSlop={8}
          style={[styles.navSide, styles.navSideEnd]}
        >
          <Text style={[styles.navAction, styles.navDone, { color: theme.accent }]}>
            Listo
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={[styles.section, { color: theme.muted }]}>Precio</Text>
        <View
          style={[
            styles.group,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          {PRICE_OPTIONS.map((option, index) => (
            <OptionRow
              key={option.id}
              label={option.label}
              selected={price === option.id}
              showSeparator={index < PRICE_OPTIONS.length - 1}
              onPress={() => onChangePrice(option.id)}
            />
          ))}
        </View>

        <Text style={[styles.section, styles.sectionSpaced, { color: theme.muted }]}>
          Fecha
        </Text>
        <View
          style={[
            styles.group,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          {DATE_OPTIONS.map((option, index) => (
            <OptionRow
              key={option.id}
              label={option.label}
              selected={date === option.id}
              showSeparator={index < DATE_OPTIONS.length - 1}
              onPress={() => onChangeDate(option.id)}
            />
          ))}
        </View>

        {price !== "todos" || date !== "todos" ? (
          <Pressable
            onPress={() => {
              onChangePrice("todos");
              onChangeDate("todos");
            }}
            style={styles.reset}
          >
            <Text style={styles.resetText}>Restablecer filtros</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function OptionRow({
  label,
  selected,
  showSeparator,
  onPress,
}: {
  label: string;
  selected: boolean;
  showSeparator: boolean;
  onPress: () => void;
}) {
  const theme = useDiscoverTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.surfaceMuted },
      ]}
    >
      <Text style={[styles.rowLabel, { color: theme.ink }]}>{label}</Text>
      {selected ? (
        <Text style={[styles.check, { color: theme.accent }]}>✓</Text>
      ) : null}
      {showSeparator ? (
        <View style={[styles.separator, { backgroundColor: theme.line }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  grabberWrap: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2,
  },
  grabberHidden: {
    display: "none",
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  nav: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSide: {
    minWidth: 80,
    justifyContent: "center",
  },
  navSideEnd: {
    alignItems: "flex-end",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
  },
  navAction: {
    fontSize: 17,
    fontWeight: "400",
  },
  navDone: {
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  section: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionSpaced: {
    marginTop: 20,
  },
  group: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: "400",
  },
  check: {
    fontSize: 17,
    fontWeight: "700",
  },
  separator: {
    position: "absolute",
    left: 16,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  reset: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  resetText: {
    fontSize: 17,
    fontWeight: "400",
    color: "#E11D48",
  },
});
