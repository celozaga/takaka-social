const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Swiper 11 uses .mjs files for its ESM builds.
// We need to add 'mjs' to the source extensions so that Metro can resolve these files.
config.resolver.sourceExts.push('mjs');

module.exports = config;
