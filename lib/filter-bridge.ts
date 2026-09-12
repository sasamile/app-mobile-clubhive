import { router } from "expo-router";
import type { DateFilter, PriceFilter } from "@/lib/discover-events";

export type FilterValues = {
  price: PriceFilter;
  date: DateFilter;
};

type Waiter = {
  values: FilterValues;
  resolve: (value: FilterValues | undefined) => void;
};

let waiter: Waiter | null = null;

export function openFilterSheet(
  values: FilterValues
): Promise<FilterValues | undefined> {
  return new Promise((resolve) => {
    waiter?.resolve(undefined);
    waiter = { values, resolve };
    router.push("/(users)/filters");
  });
}

export function readFilterDraft(): FilterValues {
  return waiter?.values ?? { price: "todos", date: "todos" };
}

export function closeFilterSheet(values?: FilterValues) {
  waiter?.resolve(values);
  waiter = null;
  if (router.canGoBack()) router.back();
}

export function discardFilterSheet() {
  waiter?.resolve(undefined);
  waiter = null;
}
