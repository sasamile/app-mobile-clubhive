import { Discover } from "@/constants/discover";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  latitude: number;
  longitude: number;
  title: string;
  dark: boolean;
};

const TILE = 256;
const GRID = 3;
const ZOOM = 16;

function lngToTile(lng: number, zoom: number) {
  return ((lng + 180) / 360) * 2 ** zoom;
}

function latToTile(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    2 ** zoom
  );
}

function tileUrl(dark: boolean, z: number, x: number, y: number) {
  const max = 2 ** z;
  const wrappedX = ((x % max) + max) % max;
  if (y < 0 || y >= max) return null;
  const style = dark ? "dark_all" : "rastertiles/voyager";
  return `https://basemaps.cartocdn.com/${style}/${z}/${wrappedX}/${y}@2x.png`;
}

export function EventLocationMap({ latitude, longitude, dark }: Props) {
  const [size, setSize] = useState({ width: 0, height: 200 });
  const x = lngToTile(longitude, ZOOM);
  const y = latToTile(latitude, ZOOM);
  const startX = Math.floor(x) - 1;
  const startY = Math.floor(y) - 1;
  const pinX = (x - startX) * TILE;
  const pinY = (y - startY) * TILE;

  const tiles: { key: string; uri: string; left: number; top: number }[] = [];
  for (let row = 0; row < GRID; row += 1) {
    for (let col = 0; col < GRID; col += 1) {
      const uri = tileUrl(dark, ZOOM, startX + col, startY + row);
      if (!uri) continue;
      tiles.push({
        key: `${col}-${row}`,
        uri,
        left: col * TILE,
        top: row * TILE,
      });
    }
  }

  return (
    <View
      style={styles.map}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      <View
        pointerEvents="none"
        style={[
          styles.grid,
          {
            transform: [
              { translateX: size.width / 2 - pinX },
              { translateY: size.height / 2 - pinY },
            ],
          },
        ]}
      >
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.uri }}
            style={[styles.tile, { left: tile.left, top: tile.top }]}
            contentFit="cover"
          />
        ))}
      </View>
      <View pointerEvents="none" style={styles.pinWrap}>
        <View style={styles.pinHalo} />
        <View style={styles.pin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: 200,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  grid: {
    width: TILE * GRID,
    height: TILE * GRID,
  },
  tile: {
    position: "absolute",
    width: TILE,
    height: TILE,
  },
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pinHalo: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(124, 77, 255, 0.28)",
  },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Discover.accent,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
});
