const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración optimizada para builds locales
config.resolver.assetExts.push(
  // Agregar extensiones de assets adicionales
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg',
  'jpeg'
);

// Configuración para Supabase simplificada
config.resolver.unstable_enableSymlinks = true;

// Configuración para minimizar el bundle
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Configuración para builds de producción
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
