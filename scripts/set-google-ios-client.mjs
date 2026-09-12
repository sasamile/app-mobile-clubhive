#!/usr/bin/env node
// Escribe el client ID de iOS de Google en app.json:
//   ios.infoPlist.GIDClientID
//   plugins["@react-native-google-signin/google-signin"].iosUrlScheme
//
// Uso: node scripts/set-google-ios-client.mjs 1014451974721-xxxxx.apps.googleusercontent.com
import { readFileSync, writeFileSync } from "node:fs";

const SUFFIX = ".apps.googleusercontent.com";
const REVERSED_PREFIX = "com.googleusercontent.apps.";
const PLUGIN_NAME = "@react-native-google-signin/google-signin";
const APP_JSON = new URL("../app.json", import.meta.url);

const clientId = process.argv[2];

if (!clientId || !clientId.endsWith(SUFFIX)) {
  console.error(
    `Pasa el client ID de iOS completo, terminado en ${SUFFIX}\n` +
      `Ejemplo: node scripts/set-google-ios-client.mjs 1014451974721-abc123${SUFFIX}`
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync(APP_JSON, "utf8"));
const infoPlist = config?.expo?.ios?.infoPlist;

if (!infoPlist) {
  console.error("No encontré expo.ios.infoPlist en app.json");
  process.exit(1);
}

const reversed = REVERSED_PREFIX + clientId.slice(0, -SUFFIX.length);

infoPlist.GIDClientID = clientId;

const plugins = config.expo.plugins;
if (!Array.isArray(plugins)) {
  console.error("No encontré expo.plugins en app.json");
  process.exit(1);
}

const pluginIndex = plugins.findIndex(
  (entry) =>
    entry === PLUGIN_NAME ||
    (Array.isArray(entry) && entry[0] === PLUGIN_NAME)
);

if (pluginIndex === -1) {
  plugins.splice(1, 0, [PLUGIN_NAME, { iosUrlScheme: reversed }]);
} else {
  plugins[pluginIndex] = [PLUGIN_NAME, { iosUrlScheme: reversed }];
}

writeFileSync(APP_JSON, JSON.stringify(config, null, 2) + "\n");

console.log("✅ app.json actualizado");
console.log("   GIDClientID:", clientId);
console.log("   URL scheme :", reversed);
console.log("\nAhora regenera el proyecto nativo:");
console.log("   npx expo prebuild --platform ios --clean && npx expo run:ios --device");
