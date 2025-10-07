@echo off
echo ========================================
echo    RecipeTunnel Claude - Build APK
echo ========================================
echo.

echo Limpiando cache y node_modules...
rmdir /s /q node_modules
del package-lock.json

echo Instalando dependencias...
npm install

echo Configurando build...
npx expo prebuild --clean --platform android

echo Construyendo APK...
npx expo run:android --variant release

echo.
echo ========================================
echo    Build completado!
echo ========================================
echo.
echo El APK se encuentra en:
echo android/app/build/outputs/apk/release/
echo.
pause
