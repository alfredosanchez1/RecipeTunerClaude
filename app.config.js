import 'dotenv/config';

export default {
  "expo": {
    "name": "RecipeTuner",
    "slug": "recipe-tunnel-claude",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "sdkVersion": "54.0.0",
    "scheme": "recipetuner",
    "ios": {
      "bundleIdentifier": "com.recipetuner.app",
      "buildNumber": "13",
      "infoPlist": {
        "NSCameraUsageDescription": "Esta app necesita acceso a la cámara para escanear recetas de imágenes y extractar texto con IA",
        "NSPhotoLibraryUsageDescription": "Esta app necesita acceso a la galería para seleccionar imágenes de recetas",
        "NSCalendarsUsageDescription": "Esta app necesita acceso a Recordatorios para exportar listas de ingredientes e instrucciones de cocina",
        "NSRemindersUsageDescription": "Esta app permite exportar ingredientes e instrucciones de recetas a la app de Recordatorios para mayor comodidad",
        "NSFaceIDUsageDescription": "RecipeTuner usa Face ID para acceso rápido y seguro a tu cuenta sin necesidad de contraseña",
        "ITSAppUsesNonExemptEncryption": false,
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["recipetuner"],
            "CFBundleURLName": "com.recipetuner.app"
          }
        ]
      }
    },
    "android": {
      "package": "com.recipetuner.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Permite a la app usar la cámara para escanear recetas.",
          "microphonePermission": false
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "La app accede a fotos para importar recetas desde la galería."
        }
      ],
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "RecipeTuner usa Face ID para proteger tus recetas y preferencias dietéticas con acceso rápido y seguro."
        }
      ],
      "expo-secure-store"
    ],
    "extra": {
      "eas": {
        "projectId": "c878cd50-a010-4ddf-bb1d-6d06780967dd"
      },
      // Cargar API keys desde .env
      "openaiApiKey": process.env.OPENAI_API_KEY
    },
    "owner": "luiscazares"
  }
};