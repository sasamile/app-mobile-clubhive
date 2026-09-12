import {
  DiscoverPalettes,
  type DiscoverPalette,
} from "@/constants/discover";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMemo } from "react";

export function useDiscoverTheme(): DiscoverPalette {
  const scheme = useColorScheme();
  return DiscoverPalettes[scheme === "dark" ? "dark" : "light"];
}

export function useThemedStyles<T>(factory: (theme: DiscoverPalette) => T): T {
  const theme = useDiscoverTheme();
  return useMemo(() => factory(theme), [theme]);
}
