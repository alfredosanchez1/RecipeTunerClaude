# 🔄 Migración de CaloriSnap a Arquitectura Multi-App

## 📋 Objetivo
Adaptar **CaloriSnap** para coexistir con **RecipeTuner** en la misma base de datos Supabase, compartiendo autenticación pero manteniendo datos completamente separados.

---

## ⚠️ IMPORTANTE: HACER ANTES DEL LANZAMIENTO
Esta migración debe completarse **ANTES** de lanzar ambas apps en App Store para evitar conflictos de datos y errores de autenticación.

---

## 📊 Estado Actual vs. Estado Deseado

### Estado Actual (❌ Problemático)
```
auth.users (Compartido)
  ↓
calorisnap_users (sin app_name, constraints globales)
  ↓
Conflicto con recipetuner_users
```

**Problemas:**
- ❌ Email único globalmente → usuario no puede usar ambas apps
- ❌ auth_user_id único globalmente → un usuario solo puede tener un perfil
- ❌ Sin filtro por app_name → datos mezclados

### Estado Deseado (✅ Correcto)
```
auth.users (Compartido)
  ↓
calorisnap_users (app_name = 'calorisnap')
recipetuner_users (app_name = 'recipetuner')
  ↓
Usuarios independientes por app
```

**Beneficios:**
- ✅ Mismo email puede usar ambas apps
- ✅ Mismo usuario auth puede tener perfiles en ambas apps
- ✅ Datos completamente separados
- ✅ Un solo proyecto Supabase (menor costo)

---

## 🔧 PASO 1: Modificaciones de Base de Datos

### 1.1 Agregar columna `app_name` a todas las tablas de CaloriSnap

```sql
-- 1. Agregar columna app_name a calorisnap_users
ALTER TABLE calorisnap_users
ADD COLUMN IF NOT EXISTS app_name TEXT NOT NULL DEFAULT 'calorisnap';

-- 2. Actualizar usuarios existentes
UPDATE calorisnap_users
SET app_name = 'calorisnap'
WHERE app_name IS NULL OR app_name = '';

-- 3. Verificar
SELECT app_name, COUNT(*) FROM calorisnap_users GROUP BY app_name;
-- Debe mostrar: calorisnap | X
```

### 1.2 Modificar Constraints Únicos

```sql
-- ❌ PASO A: Eliminar constraints globales
ALTER TABLE calorisnap_users
DROP CONSTRAINT IF EXISTS calorisnap_users_email_unique;

ALTER TABLE calorisnap_users
DROP CONSTRAINT IF EXISTS calorisnap_users_auth_unique;

ALTER TABLE calorisnap_users
DROP CONSTRAINT IF EXISTS calorisnap_users_auth_user_id_key;

-- ✅ PASO B: Agregar constraints por app
ALTER TABLE calorisnap_users
ADD CONSTRAINT calorisnap_users_email_app_unique
UNIQUE (email, app_name);

-- NOTA: NO agregar constraint para auth_user_id
-- Un usuario puede tener perfiles en múltiples apps

-- ✅ PASO C: Verificar constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'calorisnap_users'::regclass;

-- Debe tener:
-- ✅ calorisnap_users_email_app_unique
-- ✅ calorisnap_users_auth_user_id_fkey (foreign key a auth.users)
-- ❌ NO debe tener constraints globales de email o auth_user_id
```

### 1.3 Actualizar RLS Policies

```sql
-- ==========================================
-- POLICIES PARA calorisnap_users
-- ==========================================

-- SELECT: Ver solo tu perfil en CaloriSnap
DROP POLICY IF EXISTS calorisnap_users_select ON calorisnap_users;
CREATE POLICY calorisnap_users_select ON calorisnap_users
FOR SELECT
USING (
  auth.uid() = auth_user_id
  AND app_name = 'calorisnap'
);

-- INSERT: Crear solo tu perfil en CaloriSnap
DROP POLICY IF EXISTS calorisnap_users_insert ON calorisnap_users;
CREATE POLICY calorisnap_users_insert ON calorisnap_users
FOR INSERT
WITH CHECK (
  auth.uid() = auth_user_id
  AND app_name = 'calorisnap'
);

-- UPDATE: Actualizar solo tu perfil en CaloriSnap
DROP POLICY IF EXISTS calorisnap_users_update ON calorisnap_users;
CREATE POLICY calorisnap_users_update ON calorisnap_users
FOR UPDATE
USING (
  auth.uid() = auth_user_id
  AND app_name = 'calorisnap'
)
WITH CHECK (
  auth.uid() = auth_user_id
  AND app_name = 'calorisnap'
);

-- DELETE: Eliminar solo tu perfil en CaloriSnap (si aplica)
DROP POLICY IF EXISTS calorisnap_users_delete ON calorisnap_users;
CREATE POLICY calorisnap_users_delete ON calorisnap_users
FOR DELETE
USING (
  auth.uid() = auth_user_id
  AND app_name = 'calorisnap'
);

-- ==========================================
-- POLICIES PARA TABLAS RELACIONADAS
-- ==========================================

-- Ejemplo: calorisnap_meals (o como se llamen tus tablas)
-- IMPORTANTE: Actualizar TODAS las tablas relacionadas

DROP POLICY IF EXISTS calorisnap_meals_select ON calorisnap_meals;
CREATE POLICY calorisnap_meals_select ON calorisnap_meals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM calorisnap_users
    WHERE calorisnap_users.id = calorisnap_meals.user_id
    AND calorisnap_users.auth_user_id = auth.uid()
    AND calorisnap_users.app_name = 'calorisnap'
  )
);

DROP POLICY IF EXISTS calorisnap_meals_insert ON calorisnap_meals;
CREATE POLICY calorisnap_meals_insert ON calorisnap_meals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM calorisnap_users
    WHERE calorisnap_users.id = calorisnap_meals.user_id
    AND calorisnap_users.auth_user_id = auth.uid()
    AND calorisnap_users.app_name = 'calorisnap'
  )
);

DROP POLICY IF EXISTS calorisnap_meals_update ON calorisnap_meals;
CREATE POLICY calorisnap_meals_update ON calorisnap_meals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM calorisnap_users
    WHERE calorisnap_users.id = calorisnap_meals.user_id
    AND calorisnap_users.auth_user_id = auth.uid()
    AND calorisnap_users.app_name = 'calorisnap'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM calorisnap_users
    WHERE calorisnap_users.id = calorisnap_meals.user_id
    AND calorisnap_users.auth_user_id = auth.uid()
    AND calorisnap_users.app_name = 'calorisnap'
  )
);

-- ⚠️ REPETIR PARA TODAS LAS TABLAS DE CALORISNAP:
-- - calorisnap_foods
-- - calorisnap_daily_logs
-- - calorisnap_goals
-- - calorisnap_subscriptions (si existe)
-- - etc.
```

---

## 💻 PASO 2: Modificaciones de Código Frontend

### 2.1 Actualizar Servicio de Auth

**Archivo:** `src/services/supabase/auth.js` (o similar en CaloriSnap)

```javascript
/**
 * Crear perfil de usuario
 */
export const createUserProfile = async (authUser) => {
  try {
    console.log('📝 Creando perfil de usuario:', authUser.email);

    const { data, error } = await supabase
      .from('calorisnap_users')
      .insert([
        {
          auth_user_id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          app_name: 'calorisnap', // ✅ AGREGAR ESTE CAMPO
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando perfil:', error);
      throw error;
    }

    console.log('✅ Perfil creado:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error creando perfil:', error);
    throw error;
  }
};

/**
 * Verificar/crear perfil si no existe
 */
export const ensureUserProfile = async (authUser) => {
  try {
    console.log('🔍 AUTH - Verificando perfil de usuario:', authUser.id);

    // ✅ AGREGAR FILTRO POR app_name
    const { data: existingProfile, error: selectError } = await supabase
      .from('calorisnap_users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .eq('app_name', 'calorisnap') // ✅ IMPORTANTE
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ AUTH - Error buscando perfil:', selectError);
      throw selectError;
    }

    // Si existe, devolverlo
    if (existingProfile) {
      console.log('✅ AUTH - Perfil encontrado:', existingProfile.id);
      return existingProfile;
    }

    // Si no existe, crearlo
    console.log('📝 AUTH - Perfil no encontrado, creando...');
    return await createUserProfile(authUser);
  } catch (error) {
    console.error('❌ AUTH - Error verificando perfil:', error);
    // En lugar de fallar, crear el perfil automáticamente
    console.log('🔧 AUTH - Intentando crear perfil automáticamente...');
    try {
      return await createUserProfile(authUser);
    } catch (createError) {
      console.error('❌ AUTH - Error creando perfil automáticamente:', createError);
      throw error;
    }
  }
};

/**
 * Obtener perfil de usuario
 */
export const getUserProfile = async (authUserId) => {
  try {
    console.log('👤 Obteniendo perfil:', authUserId);

    // ✅ AGREGAR FILTRO POR app_name
    const { data, error } = await supabase
      .from('calorisnap_users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .eq('app_name', 'calorisnap') // ✅ IMPORTANTE
      .single();

    if (error) {
      console.error('❌ Error obteniendo perfil:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    throw error;
  }
};
```

### 2.2 Actualizar AuthContext

**Archivo:** `src/context/AuthContext.js` (o similar)

```javascript
const value = {
  user,
  session,
  loading,
  signOut,
  // ✅ Simplificar validación (no depender de email_confirmed_at)
  isAuthenticated: !!session && !!user
};
```

### 2.3 Actualizar Todas las Queries de Supabase

**⚠️ CRÍTICO:** Revisar TODAS las queries en el código que acceden a `calorisnap_users`

```javascript
// ❌ ANTES (sin filtro de app)
const { data } = await supabase
  .from('calorisnap_users')
  .select('*')
  .eq('auth_user_id', userId)
  .single();

// ✅ DESPUÉS (con filtro de app)
const { data } = await supabase
  .from('calorisnap_users')
  .select('*')
  .eq('auth_user_id', userId)
  .eq('app_name', 'calorisnap') // ✅ AGREGAR
  .single();
```

**Archivos a revisar:**
- Todos los servicios de Supabase
- Todos los hooks personalizados (useUser, useProfile, etc.)
- Componentes que hacen queries directas
- Contextos que manejan datos de usuario

---

## 🎯 PASO 3: Modificaciones de Backend (si aplica)

### 3.1 Stripe Webhooks

Si CaloriSnap usa Stripe, agregar filtro por app_name:

```javascript
async function handle_subscription_created(event) {
  const subscription = event['data']['object'];

  // ✅ Solo procesar eventos de CaloriSnap
  if (subscription.get('metadata', {}).get('app_name') != 'calorisnap') {
    logger.info(f"⏭️ Ignorando suscripción de otra app");
    return;
  }

  // ... resto del código
}
```

### 3.2 Metadata de Stripe

Agregar `app_name` al crear suscripciones:

```javascript
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: priceId }],
  metadata: {
    user_id: userId,
    app_name: 'calorisnap', // ✅ AGREGAR
    created_at: new Date().toISOString()
  }
});
```

---

## ✅ PASO 4: Testing y Verificación

### 4.1 Checklist de Verificación en Base de Datos

```sql
-- 1. Verificar columna app_name existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'calorisnap_users' AND column_name = 'app_name';
-- Debe devolver: app_name | text | 'calorisnap'

-- 2. Verificar todos los usuarios tienen app_name
SELECT COUNT(*) as total, COUNT(app_name) as con_app_name
FROM calorisnap_users;
-- total debe ser igual a con_app_name

-- 3. Verificar constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'calorisnap_users'::regclass;
-- Debe tener: calorisnap_users_email_app_unique
-- NO debe tener: constraints globales de email o auth_user_id

-- 4. Verificar policies incluyen app_name
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'calorisnap_users';
-- TODAS deben incluir: app_name = 'calorisnap'

-- 5. Verificar aislamiento entre apps
SELECT app_name, COUNT(*) as users
FROM (
  SELECT 'calorisnap' as app_name, COUNT(*) FROM calorisnap_users
  UNION ALL
  SELECT 'recipetuner' as app_name, COUNT(*) FROM recipetuner_users
) as app_counts
GROUP BY app_name;
-- Debe mostrar ambas apps con sus respectivos conteos
```

### 4.2 Tests Funcionales en la App

#### Test 1: Registro de Usuario Nuevo
1. Usar un email completamente nuevo (nunca usado en ninguna app)
2. Registrarse en CaloriSnap
3. ✅ Verificar que se crea perfil en `calorisnap_users` con `app_name = 'calorisnap'`
4. ✅ Verificar que puede hacer login correctamente
5. ✅ Verificar que puede acceder a todas las funcionalidades

```sql
-- Verificar en Supabase
SELECT id, auth_user_id, email, app_name, created_at
FROM calorisnap_users
WHERE email = 'test-calorisnap@example.com';
-- Debe mostrar: app_name = 'calorisnap'
```

#### Test 2: Usuario Existente de RecipeTuner
1. Usar un email que ya existe en RecipeTuner (ej: wiseailabs@gmail.com)
2. Intentar registrarse en CaloriSnap con ese email
3. ⚠️ No enviará correo de confirmación (ya existe en auth)
4. Hacer **login** (no registro) con la contraseña de RecipeTuner
5. ✅ Verificar que se crea un nuevo perfil en `calorisnap_users`
6. ✅ Verificar que el usuario tiene acceso solo a datos de CaloriSnap

```sql
-- Verificar que el mismo auth_user_id tiene perfiles en ambas apps
SELECT
  'calorisnap' as app,
  auth_user_id,
  email,
  created_at
FROM calorisnap_users
WHERE auth_user_id IN (
  SELECT auth_user_id FROM recipetuner_users WHERE email = 'wiseailabs@gmail.com'
)
UNION ALL
SELECT
  'recipetuner' as app,
  auth_user_id,
  email,
  created_at
FROM recipetuner_users
WHERE email = 'wiseailabs@gmail.com';

-- Debe mostrar 2 filas (una por app) con el mismo auth_user_id
```

#### Test 3: Aislamiento de Datos
1. Login en CaloriSnap con usuario que existe en ambas apps
2. ✅ Verificar que solo ve datos de CaloriSnap
3. ✅ Verificar que no puede ver/modificar datos de RecipeTuner
4. Login en RecipeTuner con el mismo usuario
5. ✅ Verificar que solo ve datos de RecipeTuner
6. ✅ Verificar que no puede ver/modificar datos de CaloriSnap

---

## 📋 PASO 5: Checklist de Migración Completa

### Base de Datos
- [ ] Agregar columna `app_name` a `calorisnap_users`
- [ ] Actualizar usuarios existentes con `app_name = 'calorisnap'`
- [ ] Eliminar constraints globales de email
- [ ] Eliminar constraints globales de auth_user_id
- [ ] Agregar constraint `(email, app_name)` unique
- [ ] Actualizar policies de `calorisnap_users` para filtrar por app_name
- [ ] Actualizar policies de TODAS las tablas relacionadas
- [ ] Verificar que todas las policies incluyen filtro por app_name

### Código Frontend
- [ ] Actualizar `createUserProfile()` para incluir `app_name`
- [ ] Actualizar `ensureUserProfile()` para filtrar por `app_name`
- [ ] Actualizar `getUserProfile()` para filtrar por `app_name`
- [ ] Revisar TODAS las queries a `calorisnap_users`
- [ ] Revisar todos los servicios de Supabase
- [ ] Revisar todos los hooks personalizados
- [ ] Simplificar `isAuthenticated` en AuthContext
- [ ] Agregar manejo de errores en `ensureUserProfile()`

### Backend (si aplica)
- [ ] Actualizar webhooks de Stripe para filtrar por app_name
- [ ] Agregar `app_name` a metadata de suscripciones de Stripe
- [ ] Actualizar endpoints que acceden a `calorisnap_users`

### Testing
- [ ] Test: Registro de usuario nuevo
- [ ] Test: Login de usuario existente
- [ ] Test: Usuario de RecipeTuner puede usar CaloriSnap
- [ ] Test: Aislamiento de datos entre apps
- [ ] Test: Suscripciones de Stripe funcionan correctamente
- [ ] Test: Webhooks procesan solo eventos de CaloriSnap

### Documentación
- [ ] Documentar cambios en README de CaloriSnap
- [ ] Crear guía de troubleshooting
- [ ] Documentar flujos de usuario entre apps

---

## ⚠️ PRECAUCIONES IMPORTANTES

### 1. Backup de Base de Datos
```bash
# Hacer backup ANTES de cualquier cambio
# En Supabase Dashboard: Database > Backups > Create Backup
```

### 2. Migración de Usuarios Existentes
Si ya tienes usuarios en producción en CaloriSnap:

```sql
-- Verificar usuarios existentes ANTES de migración
SELECT COUNT(*) FROM calorisnap_users;

-- Después de agregar app_name, verificar que todos tienen valor
SELECT COUNT(*) FROM calorisnap_users WHERE app_name IS NULL;
-- Debe devolver: 0
```

### 3. Orden de Ejecución
1. **Primero:** Cambios en base de datos (en ambiente de desarrollo)
2. **Segundo:** Cambios en código
3. **Tercero:** Testing exhaustivo
4. **Cuarto:** Deployment coordinado (base de datos + código al mismo tiempo)

### 4. Rollback Plan
Si algo falla durante la migración:

```sql
-- Rollback: Restaurar constraints originales
ALTER TABLE calorisnap_users
ADD CONSTRAINT calorisnap_users_email_unique UNIQUE (email);

-- Rollback: Eliminar columna app_name
ALTER TABLE calorisnap_users DROP COLUMN app_name;

-- Rollback: Restaurar policies originales
-- (tener copia de las policies originales antes de cambiarlas)
```

---

## 🎯 Resultado Final

Después de completar esta migración:

### ✅ CaloriSnap
- Usa `app_name = 'calorisnap'`
- Filtra todos sus datos por app_name
- Comparte auth con RecipeTuner
- Datos completamente aislados de RecipeTuner

### ✅ RecipeTuner
- Usa `app_name = 'recipetuner'`
- Filtra todos sus datos por app_name
- Comparte auth con CaloriSnap
- Datos completamente aislados de CaloriSnap

### ✅ Usuarios
- Pueden usar el mismo email en ambas apps
- Usan la misma contraseña en ambas apps
- Tienen perfiles y datos separados en cada app
- No hay conflictos ni mezcla de datos

---

## 📞 Recursos Adicionales

- **Documento de referencia:** `CONFIGURACION_MULTI_APP.md` (en RecipeTuner)
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **Testing de RLS:** https://supabase.com/docs/guides/database/testing

---

**Última actualización:** 2025-09-30
**Creado para:** CaloriSnap Migration
**Apps en el proyecto:** CaloriSnap + RecipeTuner
**Base de datos compartida:** Supabase (fcwxnabswgwlsknpvqpn)
