const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field support.
// This is required for packages like Swiper that use it to define module entry points.
config.resolver.unstable_enablePackageExports = true;

// Swiper 11 uses .mjs files for its ESM builds.
// We need to add 'mjs' to the source extensions so that Metro can resolve these files.
config.resolver.sourceExts.push('mjs');

// Enable tree shaking and bundle optimization
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Keep function names for better debugging
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
    // Optimize for size
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: process.env.NODE_ENV === 'production',
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
      // Enable aggressive optimization for production
      passes: process.env.NODE_ENV === 'production' ? 3 : 1,
      // Remove development-only code in production
      global_defs: process.env.NODE_ENV === 'production' ? {
        __DEV__: false,
      } : {},
    },
  },
  // Enable experimental tree shaking
  experimentalImportSupport: true,
  // Optimize asset loading
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Enhanced resolver configuration for better tree shaking
config.resolver = {
  ...config.resolver,
  // Define platform extensions for better tree shaking
  platforms: ['native', 'ios', 'android', 'web'],
  // Alias for better import resolution and bundle optimization
  alias: {
    '@': path.resolve(__dirname, './'),
    '@components': path.resolve(__dirname, './components'),
    '@hooks': path.resolve(__dirname, './hooks'),
    '@lib': path.resolve(__dirname, './lib'),
    '@contexts': path.resolve(__dirname, './contexts'),
    '@types': path.resolve(__dirname, './types'),
    '@assets': path.resolve(__dirname, './assets'),
  },
  // Resolve node modules more efficiently
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
};

// Platform-specific optimizations
if (process.env.EXPO_PLATFORM === 'web') {
  // Optimize for web builds
  config.transformer.enableBabelRCLookup = false;
  config.transformer.enableBabelRuntime = false;
}

// Development optimizations
if (process.env.NODE_ENV === 'development') {
  config.transformer.enableBabelRuntime = true;
}

module.exports = config;
