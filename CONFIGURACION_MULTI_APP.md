# Configuración Multi-App en Supabase

## 📋 Resumen
Este proyecto usa Supabase con **autenticación compartida** pero **datos separados por app**.

- **Auth compartido:** Múltiples apps usan la misma tabla `auth.users`
- **Datos separados:** Cada app tiene sus propias tablas con `app_name` para filtrar

## 🏗️ Arquitectura

### Base de Datos
```
auth.users (Compartido)
  ↓
recipetuner_users (app_name = 'recipetuner')
  ↓
recipetuner_recipes
recipetuner_recipe_ingredients
recipetuner_subscriptions
... (todas las tablas de RecipeTuner)
```

### Constraints Únicos por App

#### ✅ Configuración Correcta
```sql
-- Email único POR APP (permite mismo email en diferentes apps)
ALTER TABLE recipetuner_users
ADD CONSTRAINT recipetuner_users_email_app_unique
UNIQUE (email, app_name);

-- Auth user único POR APP (mismo usuario de auth puede tener perfiles en múltiples apps)
-- NO hay constraint global de auth_user_id
```

#### ❌ Configuración Incorrecta (evitar)
```sql
-- ❌ NO usar constraints globales de email
ALTER TABLE recipetuner_users
ADD CONSTRAINT recipetuner_users_email_unique
UNIQUE (email);

-- ❌ NO usar constraints globales de auth_user_id
ALTER TABLE recipetuner_users
ADD CONSTRAINT recipetuner_users_auth_unique
UNIQUE (auth_user_id);
```

## 🔐 Row Level Security (RLS)

### Tabla Principal: `recipetuner_users`

Todas las policies deben filtrar por `app_name = 'recipetuner'`:

```sql
-- SELECT: Ver solo tu perfil en esta app
DROP POLICY IF EXISTS recipetuner_users_select ON recipetuner_users;
CREATE POLICY recipetuner_users_select ON recipetuner_users
FOR SELECT
USING (
  auth.uid() = auth_user_id
  AND app_name = 'recipetuner'
);

-- INSERT: Crear solo tu perfil en esta app
DROP POLICY IF EXISTS recipetuner_users_insert ON recipetuner_users;
CREATE POLICY recipetuner_users_insert ON recipetuner_users
FOR INSERT
WITH CHECK (
  auth.uid() = auth_user_id
  AND app_name = 'recipetuner'
);

-- UPDATE: Actualizar solo tu perfil en esta app
DROP POLICY IF EXISTS recipetuner_users_update ON recipetuner_users;
CREATE POLICY recipetuner_users_update ON recipetuner_users
FOR UPDATE
USING (
  auth.uid() = auth_user_id
  AND app_name = 'recipetuner'
)
WITH CHECK (
  auth.uid() = auth_user_id
  AND app_name = 'recipetuner'
);
```

### Tablas Relacionadas

Las demás tablas se filtran a través de la foreign key a `recipetuner_users`:

```sql
-- Ejemplo: recipetuner_recipes
CREATE POLICY recipetuner_recipes_select ON recipetuner_recipes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recipetuner_users
    WHERE recipetuner_users.id = recipetuner_recipes.user_id
    AND recipetuner_users.auth_user_id = auth.uid()
    AND recipetuner_users.app_name = 'recipetuner'
  )
);
```

**Resultado:** Solo se pueden ver/crear/actualizar recetas del usuario en RecipeTuner, no de otras apps.

## 🔄 Flujo de Registro/Login

### Registro de Usuario Nuevo

1. Usuario se registra en la app (email + password)
2. Supabase crea entrada en `auth.users`
3. La app automáticamente crea perfil en `recipetuner_users`:
   ```javascript
   await createUserProfile({
     auth_user_id: authUser.id,
     email: authUser.email,
     name: userName,
     app_name: 'recipetuner'
   });
   ```
4. Usuario puede usar la app normalmente

### Login de Usuario Existente de Otra App

**Caso:** Usuario con email `user@example.com` ya existe en auth (registrado en otra app)

1. Usuario intenta registrarse en RecipeTuner con el mismo email
2. Supabase NO crea nuevo usuario en `auth.users` (ya existe)
3. Supabase NO envía correo de confirmación (email ya confirmado)
4. Usuario debe hacer **login** (no registro) con su contraseña existente
5. Al hacer login, la app crea automáticamente un perfil en `recipetuner_users`:
   ```javascript
   // En AuthContext.js - onAuthStateChange
   if (event === 'SIGNED_IN') {
     await ensureUserProfile(session.user);
   }
   ```
6. Usuario ahora tiene perfiles en ambas apps con el mismo auth user

### Login de Usuario Existente en RecipeTuner

1. Usuario hace login con email + password
2. Supabase autentica contra `auth.users`
3. La app busca perfil en `recipetuner_users` con:
   ```sql
   WHERE auth_user_id = ? AND app_name = 'recipetuner'
   ```
4. Usuario accede a sus datos de RecipeTuner

## ⚠️ Consideraciones Importantes

### 1. Mismo Email, Múltiples Apps
- ✅ **Permitido:** user@example.com en RecipeTuner y en otra app
- ✅ **Misma contraseña** para todas las apps (compartida en auth)
- ✅ **Datos separados** por app_name

### 2. Subscripciones de Stripe
Las suscripciones también se filtran por app:
```sql
-- recipetuner_subscriptions
metadata: { app_name: 'recipetuner' }
```

### 3. Webhooks de Stripe
```javascript
// Solo procesar eventos de RecipeTuner
if (subscription.metadata.app_name !== 'recipetuner') {
  return; // Ignorar
}
```

## 🧪 Testing

### Verificar Configuración Multi-App

```sql
-- 1. Verificar constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'recipetuner_users'::regclass;

-- Debe mostrar:
-- recipetuner_users_email_app_unique (UNIQUE en email + app_name)
-- recipetuner_users_auth_user_id_fkey (FOREIGN KEY a auth.users)

-- 2. Verificar policies
SELECT
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'recipetuner_users';

-- Todas deben incluir: app_name = 'recipetuner'

-- 3. Ver usuarios por app
SELECT
    app_name,
    COUNT(*) as total_users
FROM recipetuner_users
GROUP BY app_name;
```

### Probar Flujos

1. **Registro nuevo:** Email nunca usado → Debe crear usuario y perfil
2. **Login existente de otra app:** Email de otra app → Debe poder hacer login y crear perfil en RecipeTuner
3. **Login normal:** Usuario de RecipeTuner → Debe funcionar normalmente

## 📝 Checklist de Implementación

Al agregar una nueva tabla relacionada:

- [ ] Agregar foreign key a `recipetuner_users(id)`
- [ ] Crear RLS policies que filtren a través de `recipetuner_users.app_name`
- [ ] Si guarda metadata de Stripe, incluir `app_name` en metadata
- [ ] Verificar que queries en el código filtren correctamente

## 🎯 Resumen Final

**Ventajas:**
- ✅ Mismo sistema de auth para múltiples apps
- ✅ Usuarios pueden usar el mismo email/contraseña
- ✅ Datos completamente separados por app
- ✅ Un solo proyecto de Supabase (ahorro de costos)

**Desventajas:**
- ⚠️ Requiere siempre filtrar por `app_name`
- ⚠️ Policies más complejas
- ⚠️ Testing debe verificar aislamiento entre apps

---

**Última actualización:** 2025-09-30
**Configurado para:** RecipeTuner
**Otras apps en el mismo proyecto:** 1 (nombre no especificado)
