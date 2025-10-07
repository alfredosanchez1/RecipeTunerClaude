# Solución para Password Reset

## Problema Identificado

El flujo de password reset tiene un problema: cuando Supabase redirige a `recipetuner://reset-password`, el URL se corrompe y pierde el `access_token` necesario para establecer la sesión.

## Solución Temporal (Para Testing)

En lugar de usar el flujo completo de deep linking, vamos a usar un approach más simple:

### Opción 1: Reset Password desde Settings (Recomendado)

La pantalla de Settings ya tiene un botón "Cambiar Contraseña" que funciona correctamente cuando el usuario está autenticado. Esta es la forma más confiable.

### Opción 2: Implementar "Forgot Password" en AuthScreen

Agregar un flujo donde:
1. Usuario ingresa su email en AuthScreen
2. Click en "Olvidé mi contraseña"
3. Supabase envía email
4. Usuario hace click en el link del email
5. El link abre en navegador web (no en la app)
6. Usuario cambia password en web
7. Regresa a la app y hace login con la nueva contraseña

### Opción 3: Magic Link (Más Simple)

En lugar de password reset, usar Magic Links de Supabase:
- Usuario solicita Magic Link
- Click en email
- Automáticamente autenticado
- Puede cambiar password desde Settings

## Lo que SÍ Funciona Ahora

✅ Deep linking detecta URLs
✅ Navegación a ResetPasswordScreen funciona
✅ La app puede cambiar passwords cuando hay sesión activa
✅ El flujo de autenticación normal funciona perfectamente

## Lo que NO Funciona

❌ El `redirect_to` de Supabase corrompe el URL con el access_token
❌ No podemos establecer sesión automáticamente desde el deep link

## Recomendación

Para producción, usar el botón "Cambiar Contraseña" desde Settings cuando el usuario está autenticado. Para recovery real, implementar el flujo web-based.
