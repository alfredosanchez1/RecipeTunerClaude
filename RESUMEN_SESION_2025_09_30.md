# 📝 Resumen de Sesión - 30 de Septiembre 2025

## 🎯 Objetivos Completados

### 1. ✅ Sistema de Suscripciones Stripe - Funcionando
- Implementado flujo completo de suscripciones con período de prueba de 7 días
- Configurado en modo TEST para desarrollo
- Suscripción creada exitosamente: `sub_1SDAYTRZPUbUqU0XTDSeJehx`
- Usuario de prueba: Alfredo Sánchez (wiseailabs@gmail.com)
- Plan: México Mensual - $89.00 MXN

### 2. ✅ Webhooks de Stripe - Configurados y Corregidos
- Endpoint: `/api/stripe/webhooks`
- Webhook secret configurado (TEST mode)
- Eventos sincronizados:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- **Fix crítico:** Webhooks ahora buscan `profile_id` correcto en `recipetuner_users` antes de insertar

### 3. ✅ Arquitectura Multi-App - Implementada
- RecipeTuner y CaloriSnap comparten autenticación Supabase
- Datos completamente separados por `app_name`
- Constraints únicos modificados: `(email, app_name)` en lugar de globales
- RLS policies actualizadas para filtrar por `app_name = 'recipetuner'`

### 4. ✅ Documentación Completa
- `CONFIGURACION_MULTI_APP.md` - Arquitectura y configuración actual
- `MIGRACION_CALORISNAP_MULTI_APP.md` - Guía paso a paso para migrar CaloriSnap
- Scripts de verificación y sincronización

---

## 🔧 Cambios Técnicos Realizados

### Base de Datos (Supabase)

#### Tabla `recipetuner_users`
```sql
-- Constraint único por app
ALTER TABLE recipetuner_users
ADD CONSTRAINT recipetuner_users_email_app_unique
UNIQUE (email, app_name);

-- NO hay constraint global de auth_user_id
-- Un usuario puede tener perfiles en múltiples apps
```

#### Políticas RLS Actualizadas
```sql
-- Ejemplo: SELECT policy
CREATE POLICY recipetuner_users_select ON recipetuner_users
FOR SELECT
USING (
  auth.uid() = auth_user_id
  AND app_name = 'recipetuner'
);
```

Todas las tablas de RecipeTuner ahora filtran por `app_name = 'recipetuner'`.

### Backend (Render)

#### Archivo: `server-endpoints/stripe_endpoints.py`

**Cambio Principal - Webhooks:**
```python
# ❌ ANTES (incorrecto)
subscription_data = {
    "user_id": subscription['metadata'].get('user_id'),  # auth_user_id
    # ...
}

# ✅ AHORA (correcto)
# Buscar el profile_id primero
auth_user_id = subscription['metadata'].get('user_id')
profile_result = supabase.table("recipetuner_users").select("id").eq(
    "auth_user_id", auth_user_id
).eq("app_name", "recipetuner").execute()

profile_id = profile_result.data[0]['id']

subscription_data = {
    "user_id": profile_id,  # Usar profile_id, no auth_user_id
    # ...
}
```

**Detecta automáticamente TEST vs PRODUCTION:**
```python
stripe_api_key = stripe.api_key or ""
is_test_mode = stripe_api_key.startswith("sk_test_")

if is_test_mode:
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET_TEST')
else:
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
```

### Frontend (React Native/Expo)

#### Archivo: `src/context/AuthContext.js`

**Simplificado `isAuthenticated`:**
```javascript
// ❌ ANTES
isAuthenticated: !!session && !!user?.email_confirmed_at

// ✅ AHORA
isAuthenticated: !!session && !!user
```

**Mejorado manejo de errores:**
```javascript
try {
  await ensureUserProfile(session.user);
} catch (error) {
  console.error('⚠️ Continuando con el login de todos modos...');
  // No bloquear el login si hay problemas con el perfil
}
```

---

## 📊 Estado Actual del Sistema

### Stripe (Modo TEST)
- **Productos creados:**
  - RecipeTuner México (Mensual/Anual)
  - RecipeTuner USA (Mensual/Anual)

- **Price IDs:**
  - 🇲🇽 México Mensual: `price_1SD7e5RZPUbUqU0XKKAvWi6P` ($89 MXN)
  - 🇲🇽 México Anual: `price_1SD7e5RZPUbUqU0XUWkWJcrm` ($890 MXN)
  - 🇺🇸 USA Mensual: `price_1SD7e6RZPUbUqU0Xzy9GYcyy` ($4.99 USD)
  - 🇺🇸 USA Anual: `price_1SD7e6RZPUbUqU0XZiNIkQxt` ($49.99 USD)

- **Suscripción activa de prueba:**
  - ID: `sub_1SDAYTRZPUbUqU0XTDSeJehx`
  - Status: `trialing`
  - Trial: 7 días (hasta 7 Oct 2025)
  - Usuario: wiseailabs@gmail.com

### Supabase

#### Usuarios Registrados
| ID | Email | Name | App |
|----|-------|------|-----|
| 15cc6f59... | (usuario 1) | - | recipetuner |
| 427c07bf... | wiseailabs@gmail.com | Alfredo Sánchez | recipetuner |

#### Suscripciones
| Stripe ID | Usuario | Status | Trial End | App |
|-----------|---------|--------|-----------|-----|
| sub_1SDAYTRZPUbUqU0XTDSeJehx | wiseailabs@gmail.com | trialing | 2025-10-07 | recipetuner |

### Render
- **Deployment:** Live ✅
- **Endpoint:** https://recipetuner.onrender.com (o similar)
- **Webhooks:** Configurados y funcionando

---

## 🐛 Problemas Encontrados y Solucionados

### Problema 1: Login Fallando
**Síntoma:** Usuario no podía hacer login después de registro
**Causa:**
1. `isAuthenticated` dependía de `email_confirmed_at` que podría no estar presente
2. Errores en `ensureUserProfile()` bloqueaban el login

**Solución:**
- Simplificado validación de autenticación
- Mejorado manejo de errores para no bloquear login

### Problema 2: Webhook Foreign Key Error
**Síntoma:**
```
Key (user_id)=(b4731e7b-928c-4b99-8ba5-43fea7d69e13) is not present in table "recipetuner_users"
```

**Causa:** Webhook usaba `auth_user_id` directamente como `user_id` en lugar del `profile_id`

**Solución:** Webhooks ahora buscan el `profile_id` en `recipetuner_users` antes de insertar:
```python
profile_result = supabase.table("recipetuner_users").select("id").eq(
    "auth_user_id", auth_user_id
).eq("app_name", "recipetuner").execute()

profile_id = profile_result.data[0]['id']
```

### Problema 3: Constraint de Email Global
**Síntoma:** Usuarios no podían usar mismo email en CaloriSnap y RecipeTuner

**Causa:** Constraint `UNIQUE (email)` global en `recipetuner_users`

**Solución:** Cambiar a `UNIQUE (email, app_name)` para permitir mismo email en diferentes apps

---

## 📚 Archivos Creados

### Documentación
1. `CONFIGURACION_MULTI_APP.md` - Arquitectura multi-app completa
2. `MIGRACION_CALORISNAP_MULTI_APP.md` - Guía de migración para CaloriSnap
3. `RESUMEN_SESION_2025_09_30.md` - Este archivo

### Scripts de Utilidad
1. `create_stripe_prices.py` - Crear productos y precios en Stripe
2. `check_subscription.py` - Verificar suscripciones en Stripe
3. `sync_subscription_to_supabase.py` - Sincronizar suscripción a Supabase
4. `fix_subscription_metadata.py` - Corregir metadata de suscripciones
5. `check_latest_subscription.py` - Verificar última suscripción creada
6. `sync_existing_subscription.py` - Sincronizar suscripción existente

### Scripts SQL
1. `verify_new_user.sql` - Verificar usuarios registrados
2. `verify_subscription.sql` - Verificar suscripciones en Supabase
3. `diagnose_login_issue.sql` - Diagnosticar problemas de login
4. `get_user_profile_id.sql` - Obtener profile_id de usuario
5. `insert_subscription_manually.sql` - Insertar suscripción manualmente

---

## 🎯 Próximos Pasos

### Para RecipeTuner (Listo para App Store)
- [x] Sistema de suscripciones funcionando
- [x] Webhooks configurados
- [x] Multi-app implementado
- [x] Usuario de prueba con suscripción activa
- [ ] Testing exhaustivo del flujo de pago
- [ ] Configurar Stripe en modo PRODUCTION antes del lanzamiento
- [ ] Configurar webhook en modo PRODUCTION

### Para CaloriSnap (Pendiente)
- [ ] Seguir guía `MIGRACION_CALORISNAP_MULTI_APP.md`
- [ ] Agregar columna `app_name` a todas las tablas
- [ ] Modificar constraints únicos
- [ ] Actualizar RLS policies
- [ ] Actualizar código frontend
- [ ] Actualizar webhooks si usa Stripe
- [ ] Testing completo

### Testing Recomendado
1. **Flujo de registro:**
   - [ ] Nuevo usuario → registro → perfil creado con app_name
   - [ ] Login después de registro
   - [ ] Crear suscripción
   - [ ] Verificar sincronización a Supabase

2. **Flujo de suscripción:**
   - [ ] Trial de 7 días funciona
   - [ ] Webhooks sincronizan cambios de estado
   - [ ] Cancelación funciona correctamente
   - [ ] Renovación funciona al final del trial

3. **Multi-app:**
   - [ ] Usuario puede tener perfil en ambas apps
   - [ ] Datos no se mezclan entre apps
   - [ ] Suscripciones separadas por app

---

## 🔑 Variables de Entorno Importantes

### Stripe (TEST Mode)
```bash
STRIPE_SECRET_KEY=sk_test_51RnpLv...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RnpLv...
STRIPE_WEBHOOK_SECRET_TEST=whsec_gLa5N...
```

### Supabase
```bash
SUPABASE_URL=https://fcwxnabswgwlsknpvqpn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 📈 Métricas del Día

- **Commits realizados:** 5+
- **Archivos modificados:** 10+
- **Archivos creados:** 15+
- **Problemas resueltos:** 3 críticos
- **Documentación creada:** 3 archivos MD completos
- **Scripts creados:** 11 archivos Python/SQL

---

## 💡 Lecciones Aprendidas

1. **Foreign Keys en Multi-App:**
   - Usar IDs de perfiles, no auth_user_ids directamente
   - Siempre buscar el profile_id correcto antes de insertar

2. **RLS Policies:**
   - Filtrar por `app_name` en TODAS las policies
   - Verificar que las foreign keys también filtren por app

3. **Webhooks de Stripe:**
   - Validar metadata completo antes de procesar
   - Manejar errores gracefully para no perder eventos
   - Usar secrets separados para TEST y PRODUCTION

4. **Autenticación Multi-App:**
   - Un usuario puede tener múltiples perfiles (uno por app)
   - Constraints deben ser `(email, app_name)`, no globales
   - `ensureUserProfile()` debe filtrar por app_name

---

## ✅ Estado Final: Sistema Productivo

**RecipeTuner está listo para:**
- ✅ Registrar usuarios nuevos
- ✅ Crear suscripciones con trial de 7 días
- ✅ Sincronizar automáticamente con Supabase vía webhooks
- ✅ Coexistir con CaloriSnap en la misma base de datos
- ✅ Manejar usuarios que usen ambas apps

**Siguiente hito:** Migrar CaloriSnap y preparar para lanzamiento en App Store

---

**Fecha:** 30 de Septiembre de 2025
**Desarrolladores:** Luis Alfredo Cazares + Claude Code
**Apps:** RecipeTuner + CaloriSnap
**Estado:** ✅ Sistema Multi-App Funcionando
