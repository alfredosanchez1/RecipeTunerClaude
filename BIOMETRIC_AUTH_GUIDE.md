# 🔐 Guía de Autenticación Biométrica - RecipeTuner

## ✅ Implementación Completada

Se ha implementado exitosamente la autenticación biométrica (Face ID / Touch ID) en RecipeTuner.

---

## 📋 Archivos Creados/Modificados

### **Archivos Nuevos:**
1. ✨ `src/services/BiometricService.js` - Servicio singleton para manejo de biometría
2. ✨ `src/components/BiometricSetupModal.js` - Modal de configuración inicial
3. ✨ `src/screens/BiometricLockScreen.js` - Pantalla de bloqueo biométrico

### **Archivos Modificados:**
1. 🔧 `src/screens/AuthScreen.js` - Modal de setup después del login
2. 🔧 `App.js` - Detección y manejo de biometric lock
3. 🔧 `src/navigation/AuthNavigator.js` - Agregada BiometricLockScreen
4. 🔧 `src/screens/settings/SettingsScreen.js` - Toggle de biometría
5. 🔧 `src/context/AuthContext.js` - Cleanup de biometría al logout
6. 🔧 `app.json` - Permisos de Face ID y plugins

---

## 🚀 Cómo Probar

### **Paso 1: Preparar el entorno**
```bash
# Limpiar e instalar dependencias
npx expo prebuild --clean --platform ios
cd ios && pod install && cd ..

# Ejecutar en simulador iOS
npx expo run:ios
```

### **Paso 2: Flujo de Configuración Inicial**

1. **Login con email/password:**
   - Inicia sesión normalmente
   - Después del login exitoso, verás el modal de setup de biometría

2. **Modal de Setup:**
   - Aparece automáticamente si:
     - ✅ El dispositivo tiene Face ID/Touch ID
     - ✅ No has rechazado el setup antes
     - ✅ La biometría no está ya habilitada
   - Opciones:
     - "Habilitar Face ID / Touch ID" → Solicita autenticación y guarda credenciales
     - "Ahora no" → No muestra de nuevo para ese email

3. **Configuración desde Settings:**
   - Ve a Settings (Configuración)
   - Busca la sección "Seguridad"
   - Verás el toggle "Usar Face ID / Touch ID"

---

## 🔄 Flujo Completo de Usuario

### **Escenario 1: Primera Vez (Usuario Nuevo)**
```
1. Usuario hace login → ✅
2. Modal de biometría aparece → Usuario acepta
3. Face ID se solicita → Usuario autentica
4. Credenciales guardadas en SecureStore → ✅
5. Usuario cierra la app
6. Usuario reabre la app
7. BiometricLockScreen aparece automáticamente
8. Face ID se solicita automáticamente
9. Autenticación exitosa → Entra a la app sin contraseña
```

### **Escenario 2: Usuario Rechaza Setup Inicial**
```
1. Usuario hace login → ✅
2. Modal de biometría aparece → Usuario presiona "Ahora no"
3. Modal no vuelve a aparecer para ese email
4. Usuario puede habilitar después desde Settings
```

### **Escenario 3: Deshabilitar Biometría**
```
1. Usuario va a Settings → Seguridad
2. Desactiva el switch "Usar Face ID"
3. Confirmación: "¿Deshabilitar biometría?"
4. Credenciales eliminadas de SecureStore
5. Próximo login requiere contraseña
```

### **Escenario 4: Autenticación Fallida**
```
1. BiometricLockScreen aparece
2. Face ID falla (3 intentos)
3. Mensaje de error aparece
4. Botón "Usar contraseña" disponible
5. Usuario puede hacer login manual
```

---

## 🔍 Testing en Simulador iOS

### **Simular Face ID en Simulador:**

1. Ejecuta el simulador iOS
2. Ve a: **Features → Face ID → Enrolled**
3. Prueba autenticación:
   - **Features → Face ID → Matching Face** (éxito)
   - **Features → Face ID → Non-matching Face** (fallo)

### **Debug Logs Importantes:**

Busca estos logs en la consola:

```
✅ BiometricService inicializado
🔐 Settings - Biometría: {available: true, enabled: false, type: 'Face ID'}
🔐 APP - Biometría habilitada: true
🔐 APP - Mostrando BiometricLockScreen
✅ Autenticación biométrica exitosa
```

---

## 🛡️ Seguridad Implementada

1. **Almacenamiento Seguro:**
   - Las credenciales se guardan en `SecureStore` (Keychain en iOS)
   - El token de sesión nunca se expone en logs

2. **Validación de Sesión:**
   - Siempre se verifica que la sesión de Supabase siga válida
   - Si la sesión expiró, se fuerza login completo

3. **Limpieza al Logout:**
   - Todas las credenciales biométricas se eliminan al cerrar sesión
   - No quedan datos residuales

4. **Fallback Seguro:**
   - Si algo falla con biometría, siempre hay opción de usar contraseña
   - El flujo normal de login nunca se rompe

---

## 📱 Compatibilidad

- ✅ **iOS:** Face ID + Touch ID (iOS 13+)
- ✅ **Android:** Fingerprint + Face Unlock (API 23+)
- ✅ **Simulador:** Face ID simulado

---

## 🐛 Troubleshooting

### **El modal de setup no aparece:**
- ✅ Verifica que el dispositivo tenga biometría configurada
- ✅ Verifica que no hayas rechazado el setup antes (limpia AsyncStorage)
- ✅ Revisa los logs: `BiometricService.isAvailable()`

### **BiometricLockScreen no aparece al abrir app:**
- ✅ Verifica que la biometría esté habilitada en Settings
- ✅ Verifica que haya sesión activa de Supabase
- ✅ Revisa los logs: `🔐 APP - Biometría habilitada: true`

### **Face ID falla en simulador:**
- ✅ Verifica: **Features → Face ID → Enrolled**
- ✅ Usa: **Features → Face ID → Matching Face**

### **Credenciales no se guardan:**
- ✅ Verifica que el token de sesión exista
- ✅ Revisa permisos en `app.json`
- ✅ Verifica logs de SecureStore

---

## 🎯 Próximos Pasos

1. **Testing en Dispositivo Real:**
   ```bash
   # Build para dispositivo iOS
   eas build --platform ios --profile development
   ```

2. **Testing en Android:**
   ```bash
   # Build para Android
   eas build --platform android --profile development
   ```

3. **Testing de Edge Cases:**
   - Sesión expirada mientras biometría está habilitada
   - Cambio de contraseña con biometría habilitada
   - Múltiples usuarios en el mismo dispositivo
   - App en background → foreground (re-lock)

---

## 📞 Soporte

Si encuentras algún problema:

1. Revisa los logs en consola (busca emojis: 🔐 ✅ ❌)
2. Verifica que `expo-local-authentication` y `expo-secure-store` estén instalados
3. Asegúrate de que `app.json` tenga los permisos correctos
4. Ejecuta `npx expo prebuild --clean` para regenerar nativos

---

## ✨ Características Implementadas

- [x] Servicio BiometricService singleton
- [x] Modal de setup después del login
- [x] BiometricLockScreen al abrir app
- [x] Toggle en Settings para habilitar/deshabilitar
- [x] Limpieza automática al cerrar sesión
- [x] Manejo de errores y fallbacks
- [x] Soporte para Face ID y Touch ID
- [x] Almacenamiento seguro en Keychain
- [x] Validación de sesión de Supabase
- [x] Animaciones y UX pulidas
- [x] Logs detallados para debugging

---

**¡La autenticación biométrica está lista para usar! 🎉**
