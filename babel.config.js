module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      ['babel-preset-expo', {
        // Configuración optimizada para builds de producción
        jsxImportSource: 'react',
        enableBabelRuntime: false,
      }]
    ],
    plugins: [
      // Plugin para React Native Reanimated
      'react-native-reanimated/plugin',
      
      // Plugin para optimización de imports
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@context': './src/context',
            '@services': './src/services',
            '@config': './src/config',
          },
        },
      ],
      
      // Plugin para optimización de producción
      [
        'transform-remove-console',
        {
          exclude: ['error', 'warn', 'info'],
        },
      ],
    ],
    
    // Configuración para builds de producción
    env: {
      production: {
        plugins: [
          'transform-remove-console',
          'transform-remove-debugger',
        ],
      },
    },
  };
};
