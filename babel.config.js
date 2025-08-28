module.exports = function(api) {
  api.cache(true);
  
  const isProduction = process.env.NODE_ENV === 'production';
  const isWeb = process.env.EXPO_PLATFORM === 'web';
  
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Optimize for the target platform
          targets: isWeb ? {
            browsers: ['last 2 versions', 'not dead', '> 0.2%']
          } : undefined,
        },
      ],
    ],
    plugins: [
      // Transform imports for better tree shaking (disabled due to compatibility issues)
      // [
      //   'babel-plugin-transform-imports',
      //   {
      //     'lodash': {
      //       transform: 'lodash/{{member}}',
      //       preventFullImport: true,
      //     },
      //   },
      // ],
      // Remove console statements in production
      isProduction && [
        'babel-plugin-transform-remove-console',
        {
          exclude: ['error', 'warn'],
        },
      ],
      // Optimize React components in production
      isProduction && [
        'babel-plugin-transform-react-remove-prop-types',
        {
          mode: 'remove',
          removeImport: true,
        },
      ],
      // Inline environment variables
      [
        'babel-plugin-transform-inline-environment-variables',
        {
          include: ['NODE_ENV', 'EXPO_PLATFORM'],
        },
      ],
      // React Native Reanimated plugin (must be last)
      'react-native-reanimated/plugin',
    ].filter(Boolean),
    env: {
      production: {
        plugins: [
          // Additional production optimizations
          'babel-plugin-transform-remove-debugger',
          [
            'babel-plugin-minify-dead-code-elimination',
            {
              optimizeRawSize: true,
            },
          ],
        ],
      },
      development: {
        plugins: [
          // Development-only plugins for better debugging
          '@babel/plugin-transform-react-jsx-source',
        ],
      },
    },
  };
};