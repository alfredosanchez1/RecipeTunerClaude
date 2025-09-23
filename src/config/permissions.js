import { Platform } from 'react-native';

// Configuración de permisos para diferentes entornos
export const PERMISSIONS_CONFIG = {
  // Permisos de cámara
  CAMERA: {
    required: true,
    fallback: false,
    message: 'Necesitamos acceso a la cámara para tomar fotos de recetas.',
  },
  
  // Permisos de galería
  MEDIA_LIBRARY: {
    required: false, // En Expo Go puede no estar disponible
    fallback: true,  // Usar fallback cuando sea posible
    message: 'Para acceder a la galería, necesitamos permisos de almacenamiento.',
  },
  
  // Permisos de notificaciones
  NOTIFICATIONS: {
    required: false,
    fallback: true,
    message: 'Las notificaciones te ayudarán a recibir alertas de nuevas recetas.',
  },
  
  // Permisos de archivos
  FILE_SYSTEM: {
    required: true,
    fallback: false,
    message: 'Necesitamos acceso a archivos para procesar imágenes.',
  },
};

// Función para verificar si estamos en Expo Go
export const isExpoGo = () => {
  return __DEV__ && !global.__EXPO_DEVTOOLS_LISTEN_ADDRESS__;
};

// Función para obtener mensaje de permiso según el entorno
export const getPermissionMessage = (permissionType) => {
  const config = PERMISSIONS_CONFIG[permissionType];
  if (!config) return 'Permiso requerido para esta funcionalidad.';
  
  if (isExpoGo() && permissionType === 'MEDIA_LIBRARY') {
    return 'En Expo Go, algunas funcionalidades de galería pueden estar limitadas. Para funcionalidad completa, crea un development build.';
  }
  
  return config.message;
};

// Función para verificar si un permiso es crítico
export const isPermissionCritical = (permissionType) => {
  const config = PERMISSIONS_CONFIG[permissionType];
  return config ? config.required : false;
};

// Función para verificar si se puede usar fallback
export const canUseFallback = (permissionType) => {
  const config = PERMISSIONS_CONFIG[permissionType];
  return config ? config.fallback : false;
};

// Configuración específica por plataforma
export const getPlatformSpecificConfig = () => {
  if (Platform.OS === 'android') {
    return {
      camera: 'android.permission.CAMERA',
      storage: 'android.permission.READ_EXTERNAL_STORAGE',
      notifications: 'android.permission.POST_NOTIFICATIONS',
    };
  } else if (Platform.OS === 'ios') {
    return {
      camera: 'NSCameraUsageDescription',
      photoLibrary: 'NSPhotoLibraryUsageDescription',
      notifications: 'NSUserNotificationUsageDescription',
    };
  }
  
  return {};
};

// Mensajes de ayuda para el usuario
export const PERMISSION_HELP_MESSAGES = {
  CAMERA: {
    title: 'Permiso de Cámara',
    message: 'La cámara es necesaria para capturar fotos de recetas. Sin este permiso, no podrás usar la funcionalidad de captura de fotos.',
    steps: [
      'Ve a Configuración > Aplicaciones > RecipeTuner',
      'Toca "Permisos"',
      'Activa "Cámara"'
    ]
  },
  MEDIA_LIBRARY: {
    title: 'Permiso de Galería',
    message: 'El acceso a la galería te permite seleccionar imágenes existentes de recetas.',
    steps: [
      'Ve a Configuración > Aplicaciones > RecipeTuner',
      'Toca "Permisos"',
      'Activa "Almacenamiento"'
    ]
  },
  NOTIFICATIONS: {
    title: 'Permiso de Notificaciones',
    message: 'Las notificaciones te alertan sobre nuevas recetas recibidas y adaptaciones completadas.',
    steps: [
      'Ve a Configuración > Aplicaciones > RecipeTuner',
      'Toca "Notificaciones"',
      'Activa "Permitir notificaciones"'
    ]
  }
};

// Función para obtener mensaje de ayuda específico
export const getHelpMessage = (permissionType) => {
  return PERMISSION_HELP_MESSAGES[permissionType] || {
    title: 'Permiso Requerido',
    message: 'Este permiso es necesario para usar la funcionalidad.',
    steps: ['Contacta al soporte para obtener ayuda.']
  };
};
