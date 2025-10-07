# Guía de Recuperación de Contraseña - RecipeTuner

## Resumen
Se ha implementado un sistema completo de recuperación de contraseña que permite a los usuarios restablecer su contraseña mediante email de forma segura.

## Flujo de Usuario

### 1. Solicitar Recuperación
1. El usuario accede a la pantalla de login
2. Hace clic en "¿Olvidaste tu contraseña?"
3. Se abre un modal donde ingresa su email
4. El sistema valida el email y envía un enlace de recuperación
5. Se muestra un mensaje de confirmación

### 2. Email de Recuperación
- Supabase envía automáticamente un email al usuario
- El email contiene un enlace seguro con token temporal
- El enlace redirige a: `https://recipetunerclaude.onrender.com/reset-password`
- El token expira en 24 horas por seguridad

### 3. Establecer Nueva Contraseña
1. El usuario hace clic en el enlace del email
2. Es redirigido a la pantalla de reset de contraseña
3. Ingresa y confirma su nueva contraseña
4. El sistema valida que la contraseña cumpla los requisitos
5. Se actualiza la contraseña y el usuario puede iniciar sesión

## Componentes Implementados

### 1. AuthScreen.js (Mejorado)
- **Modal de recuperación**: Interfaz limpia para solicitar reset
- **Validación de email**: Verificación antes de enviar
- **Manejo de errores**: Mensajes específicos para diferentes escenarios
- **Estados de carga**: Feedback visual durante el proceso

**Características:**
- Modal con Portal para mejor UX
- Validación en tiempo real del email
- Manejo de rate limiting
- Mensajes de error específicos

### 2. ResetPasswordScreen.js (Nuevo)
- **Verificación de sesión**: Confirma que el usuario viene del email
- **Formulario de nueva contraseña**: Campos seguros con validación
- **Requisitos visuales**: Indicadores de cumplimiento de requisitos
- **Navegación**: Redirección automática después del éxito

**Características:**
- Verificación automática de enlace válido
- Campos de contraseña con toggle de visibilidad
- Validación en tiempo real de requisitos
- Redirección automática al login

### 3. AuthNavigator.js (Nuevo)
- **Stack Navigator**: Maneja navegación entre Auth y ResetPassword
- **Sin headers**: Interfaz limpia para autenticación
- **Deep linking**: Soporte para URLs de reset

### 4. Servicios Actualizados

#### auth.js
```javascript
// Función mejorada de reset
export const resetPassword = async (email, redirectTo = null)

// Nueva función para actualizar contraseña
export const updatePassword = async (newPassword)
```

## Configuración Técnica

### 1. Deep Linking
```javascript
const linking = {
  prefixes: [
    Linking.makeUrl('/'),
    'https://recipetunerclaude.onrender.com',
    'recipetuner://'
  ],
  config: {
    screens: {
      AuthNavigator: {
        screens: {
          Auth: 'auth',
          ResetPassword: 'reset-password',
        },
      },
    },
  },
};
```

### 2. URL de Redirección
- **Producción**: `https://recipetunerclaude.onrender.com/reset-password`
- **Deep link local**: `recipetuner://reset-password`

### 3. Validaciones de Seguridad
- Contraseña mínimo 6 caracteres
- Confirmación de contraseña
- Verificación de sesión válida
- Token temporal con expiración

## Manejo de Errores

### Errores Comunes y Mensajes
1. **Email no válido**: "Por favor ingresa un email válido"
2. **Email no encontrado**: "No encontramos una cuenta asociada a este email"
3. **Rate limiting**: "Has enviado demasiadas solicitudes. Espera unos minutos"
4. **Enlace expirado**: "El enlace de restablecimiento ha expirado o es inválido"
5. **Contraseña débil**: "La contraseña es demasiado débil"

### Estados de Error
- Validación en cliente antes de enviar
- Manejo de errores de red
- Feedback visual claro
- Opciones de recuperación

## Configuración en Supabase

### Email Templates
Supabase maneja automáticamente:
- Plantilla de email de recuperación
- Tokens seguros temporales
- Expiración automática (24h)
- Rate limiting por IP

### URL Configuration
En el dashboard de Supabase:
1. Auth > URL Configuration
2. Site URL: `https://recipetunerclaude.onrender.com`
3. Redirect URLs: Incluir URL de reset

## Testing

### Flujo de Prueba Manual
1. **Solicitar reset**:
   - Ir a pantalla de login
   - Tocar "¿Olvidaste tu contraseña?"
   - Ingresar email válido
   - Verificar mensaje de confirmación

2. **Verificar email**:
   - Revisar inbox del email
   - Hacer clic en enlace
   - Verificar redirección correcta

3. **Establecer nueva contraseña**:
   - Ingresar nueva contraseña
   - Confirmar contraseña
   - Verificar validaciones
   - Completar proceso

4. **Login con nueva contraseña**:
   - Volver a pantalla de login
   - Usar nueva contraseña
   - Verificar acceso exitoso

### Casos Edge para Probar
- Email no existente
- Enlace expirado
- Contraseñas que no coinciden
- Contraseñas muy débiles
- Múltiples solicitudes (rate limiting)

## Beneficios de la Implementación

### Para el Usuario
- **Fácil recuperación**: Proceso simple de 3 pasos
- **Interfaz intuitiva**: Modal claro y guiado
- **Feedback claro**: Mensajes específicos y útiles
- **Seguridad**: Tokens temporales y validaciones

### Para la App
- **Reducción de soporte**: Usuarios pueden resolver problema solos
- **Mejor UX**: Evita frustración por cuentas bloqueadas
- **Seguridad**: Cumple mejores prácticas de seguridad
- **Escalabilidad**: Sistema automático sin intervención manual

## Próximos Pasos

### Mejoras Opcionales
1. **Personalización de emails**: Templates custom en Supabase
2. **2FA opcional**: Autenticación de dos factores
3. **Historial de passwords**: Evitar reutilización reciente
4. **Analytics**: Tracking de uso del flujo de recuperación

### Mantenimiento
1. **Monitoreo**: Revisar logs de recuperación
2. **Rate limiting**: Ajustar límites según uso
3. **Templates**: Actualizar mensajes según feedback
4. **Testing**: Pruebas regulares del flujo completo

## Conclusión

El sistema de recuperación de contraseña está completamente implementado y listo para uso en producción. Proporciona una experiencia de usuario fluida mientras mantiene altos estándares de seguridad.