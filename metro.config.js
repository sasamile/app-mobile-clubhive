const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = config.resolver;

config.resolver.assetExts = [...assetExts.filter((ext) => ext !== "svg"), "svg"];
config.resolver.sourceExts = sourceExts.filter((ext) => ext !== "svg");

module.exports = config;
