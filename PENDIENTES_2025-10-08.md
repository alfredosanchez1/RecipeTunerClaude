# Pendientes para el 8 de Octubre 2025

## 🔴 Alta Prioridad

### 1. Probar Fix de Navegación con Face ID
- **Build**: Versión 1.0.0 (9)
- **Qué probar**:
  - [ ] Hacer login con usuario y contraseña
  - [ ] Verificar que después del alert "¡Bienvenido!" la app navegue automáticamente a MainNavigator
  - [ ] Si aparece el modal de Face ID, aceptar configurarlo
  - [ ] Autenticar con Face ID
  - [ ] Verificar que la app muestre la pantalla principal correctamente
  - [ ] Cerrar la app completamente
  - [ ] Volver a abrir la app
  - [ ] Verificar que pida Face ID automáticamente
  - [ ] Autenticar con Face ID y verificar que entre a la app

### 2. Issues Conocidos a Verificar
- [ ] Si el login no navega automáticamente → revisar logs de consola para ver qué flag está fallando
- [ ] Si Face ID no se dispara al abrir la app → verificar que `biometric_verified_session` se limpió al cerrar sesión
- [ ] Si aparece pantalla en blanco → revisar estado de `biometricCheckComplete` en logs

## 🟡 Prioridad Media

### 3. Funcionalidades Pendientes de Face ID
- [ ] Agregar opción en Settings para deshabilitar Face ID
- [ ] Agregar opción para cambiar entre Face ID / Touch ID / Biometría
- [ ] Mostrar indicador visual cuando Face ID está habilitada (en ProfileScreen o Settings)

### 4. Mejoras de UX
- [ ] Agregar animación de transición cuando pasa de AuthScreen a MainNavigator
- [ ] Mejorar mensaje de error cuando Face ID falla 3 veces
- [ ] Agregar opción "No volver a preguntar" en modal de configuración de Face ID

## 🟢 Prioridad Baja

### 5. Testing y Documentación
- [ ] Documentar flujo completo de Face ID en BIOMETRIC_AUTH_GUIDE.md
- [ ] Agregar screenshots del flujo de Face ID
- [ ] Crear tests unitarios para BiometricService
- [ ] Crear tests de integración para flujo de autenticación completo

### 6. Optimizaciones
- [ ] Revisar si el polling de AsyncStorage se puede optimizar con event listeners
- [ ] Considerar usar Context API para manejar estado de biometría en lugar de AsyncStorage
- [ ] Evaluar si `refreshSession()` es necesario o si hay una forma más eficiente

## 📝 Notas Técnicas

### Cambios Realizados Hoy (7 de Octubre)
1. **Fix de navegación**: Agregado flag `biometric_verified_session` en AsyncStorage para tracking de sesión biométrica
2. **Flujo mejorado**: BiometricLockScreen ahora fuerza re-render con `refreshSession()` después de autenticación exitosa
3. **Limpieza automática**: Flag se limpia automáticamente al hacer logout en AuthContext
4. **Build Number**: Incrementado a 9 para nuevo build de TestFlight

### Archivos Modificados
- `App.js` - Lógica de navegación mejorada
- `src/context/AuthContext.js` - Limpieza de flag biométrico al logout
- `src/screens/BiometricLockScreen.js` - Manejo de autenticación exitosa con flag

### Comandos Útiles
```bash
# Crear nuevo build para TestFlight
eas build --platform ios --profile preview

# Ver logs de la app en tiempo real (cuando esté corriendo)
npx expo start

# Ver estado de builds
eas build:list

# Ver detalles de un build específico
eas build:view [BUILD_ID]
```

## 🐛 Bugs Conocidos

### Bug #1: Login se queda en AuthScreen
- **Status**: FIXED ✅ (pendiente de verificar en build 9)
- **Causa**: Faltaba comunicación entre BiometricLockScreen y App.js
- **Solución**: Agregado flag temporal en AsyncStorage

### Bug #2: Face ID no se dispara al abrir la app
- **Status**: PENDIENTE DE VERIFICAR
- **Posible causa**: Flag de sesión no se está limpiando correctamente
- **Solución propuesta**: Verificar logs y revisar lógica de limpieza en AuthContext

## 📱 TestFlight

### Build Actual en TestFlight
- **Versión**: 1.0.0 (8)
- **Fecha**: 7 de Octubre 2025
- **Issues**: Login no navega después de autenticación exitosa

### Próximo Build
- **Versión**: 1.0.0 (9)
- **Fecha estimada**: 8 de Octubre 2025
- **Fixes incluidos**: Navegación después de login, flujo de Face ID mejorado

## 💡 Ideas para Futuras Mejoras

1. **Onboarding de Face ID**: Tutorial visual explicando beneficios de Face ID
2. **Biometría en acciones sensibles**: Pedir Face ID antes de eliminar recetas importantes
3. **Multi-factor**: Combinar Face ID + PIN para mayor seguridad
4. **Logs de seguridad**: Registrar intentos fallidos de Face ID
5. **Notificaciones**: Alertar al usuario si se deshabilitó Face ID inesperadamente

## ⚠️ Recordatorios

- NO subir API keys al repositorio (ya está protegido con pre-commit hook)
- Verificar que `.env` esté en `.gitignore`
- Antes de hacer build de producción, incrementar `buildNumber` en `app.config.js`
- TestFlight requiere builds con `--profile preview` o `--profile production`

---

**Última actualización**: 7 de Octubre 2025, 11:45 PM
**Próxima sesión**: 8 de Octubre 2025
