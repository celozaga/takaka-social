const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field support.
// This is required for packages like Swiper that use it to define module entry points.
config.resolver.unstable_enablePackageExports = true;

// Swiper 11 uses .mjs files for its ESM builds.
// We need to add 'mjs' to the source extensions so that Metro can resolve these files.
config.resolver.sourceExts.push('mjs');

module.exports = config;
