# 🚀 Instrucciones para Crear APK de RecipeTunnel Claude

## 📋 Prerrequisitos

### 1. **Software Requerido**
- Node.js 18+ instalado
- Java JDK 11 o 17
- Android Studio con Android SDK
- Variables de entorno configuradas (ANDROID_HOME, JAVA_HOME)

### 2. **Configuración de Android Studio**
- Instalar Android SDK Platform 33 (Android 13)
- Instalar Android SDK Build-Tools 33.0.0
- Instalar Android SDK Platform-Tools
- Crear un emulador Android o conectar dispositivo físico

## 🛠️ Método 1: Build Local con Expo (Recomendado)

### Paso 1: Limpiar y Preparar
```bash
# Limpiar cache
npx expo start --clear

# Limpiar build anterior
npx expo prebuild --clean
```

### Paso 2: Configurar Build
```bash
# Generar código nativo
npx expo prebuild --platform android --clean
```

### Paso 3: Construir APK
```bash
# Build de release
npx expo run:android --variant release

# O build de debug
npx expo run:android --variant debug
```

### Paso 4: Ubicación del APK
El APK se generará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🛠️ Método 2: Build con EAS (Requiere Cuenta Expo)

### Paso 1: Configurar EAS
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Iniciar sesión
eas login

# Configurar proyecto
eas build:configure
```

### Paso 2: Construir APK
```bash
# Build de preview (APK)
eas build --platform android --profile preview

# Build de producción (APK)
eas build --platform android --profile production
```

## 🛠️ Método 3: Build Manual con Gradle

### Paso 1: Generar Código Nativo
```bash
npx expo prebuild --platform android --clean
```

### Paso 2: Abrir en Android Studio
```bash
# Abrir la carpeta android/ en Android Studio
cd android
./gradlew assembleRelease
```

### Paso 3: Firmar APK
```bash
# Generar keystore
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

# Firmar APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk alias_name

# Optimizar APK
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

## 🔧 Solución de Problemas Comunes

### Error: "SDK location not found"
```bash
# Crear archivo local.properties en android/
echo sdk.dir=C:\\Users\\USERNAME\\AppData\\Local\\Android\\Sdk > android/local.properties
```

### Error: "Java version not compatible"
```bash
# Verificar versión de Java
java -version

# Configurar JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-17
```

### Error: "Gradle build failed"
```bash
# Limpiar cache de Gradle
cd android
./gradlew clean
./gradlew assembleRelease
```

## 📱 Configuración del APK

### Permisos Incluidos
- `android.permission.CAMERA` - Acceso a cámara
- `android.permission.READ_EXTERNAL_STORAGE` - Acceso a galería
- `android.permission.WRITE_EXTERNAL_STORAGE` - Guardar archivos
- `android.permission.POST_NOTIFICATIONS` - Notificaciones push
- `android.permission.INTERNET` - Conexión a internet

### Características del APK
- **Tamaño estimado**: 15-25 MB
- **Versión mínima de Android**: API 21 (Android 5.0)
- **Versión objetivo**: API 33 (Android 13)
- **Arquitectura**: ARM64, x86_64

## 🎯 Optimizaciones para MVP

### 1. **Reducir Tamaño del APK**
```bash
# Habilitar ProGuard
# En android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. **Configuración de Babel**
```javascript
// En babel.config.js
env: {
  production: {
    plugins: [
      'transform-remove-console',
      'transform-remove-debugger',
    ],
  },
}
```

### 3. **Configuración de Metro**
```javascript
// En metro.config.js
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});
```

## 📦 Distribución del APK

### 1. **Instalación Directa**
```bash
# Instalar en dispositivo conectado
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 2. **Compartir APK**
- Subir a Google Drive
- Usar servicios como WeTransfer
- Compartir por email
- Usar aplicaciones de transferencia de archivos

### 3. **Testing del APK**
- Instalar en diferentes dispositivos Android
- Probar en diferentes versiones de Android
- Verificar funcionalidades principales
- Test de rendimiento y estabilidad

## 🚀 Comandos Rápidos

### Build Completo en un Comando
```bash
npm run build:android
```

### Build de Desarrollo
```bash
npm run build:android-dev
```

### Limpiar y Reconstruir
```bash
npm run prebuild && npm run build:android
```

## 📋 Checklist de Build

- [ ] Node.js 18+ instalado
- [ ] Java JDK 11/17 instalado
- [ ] Android Studio configurado
- [ ] Variables de entorno configuradas
- [ ] Dispositivo/emulador conectado
- [ ] Dependencias instaladas
- [ ] Código nativo generado
- [ ] APK construido exitosamente
- [ ] APK instalado y probado
- [ ] Funcionalidades verificadas

## 🆘 Soporte

Si encuentras problemas durante el build:

1. **Verificar logs**: Revisar output de la consola
2. **Limpiar cache**: `npx expo start --clear`
3. **Reinstalar dependencias**: `rm -rf node_modules && npm install`
4. **Verificar configuración**: Revisar archivos de configuración
5. **Consultar documentación**: [Expo Build](https://docs.expo.dev/build/introduction/)

---

**¡Tu APK de RecipeTunnel Claude estará listo para demostrar el MVP! 🎉**
