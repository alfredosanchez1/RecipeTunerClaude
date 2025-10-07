-- ============================================
-- Script de Optimización: Índices de Performance
-- Fecha: 2025-09-29
-- Propósito: Mejorar velocidad de queries en Supabase
-- ============================================

-- ÍNDICES PARA TABLA: recipetuner_users
-- ----------------------------------------------

-- Índice para búsqueda por auth_user_id (query más común)
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id
ON recipetuner_users(auth_user_id);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_users_email
ON recipetuner_users(email);

-- Índice para filtrar por app_name (si hay múltiples apps)
CREATE INDEX IF NOT EXISTS idx_users_app_name
ON recipetuner_users(app_name);


-- ÍNDICES PARA TABLA: recipetuner_user_preferences
-- ----------------------------------------------

-- Índice para búsqueda por user_id (query más común)
CREATE INDEX IF NOT EXISTS idx_preferences_user_id
ON recipetuner_user_preferences(user_id);

-- Índice para filtrar por diet_type
CREATE INDEX IF NOT EXISTS idx_preferences_diet_type
ON recipetuner_user_preferences(diet_type)
WHERE diet_type IS NOT NULL AND diet_type != '';


-- ÍNDICES PARA TABLA: recipetuner_recipes
-- ----------------------------------------------

-- Índice para búsqueda por user_id (listar recetas del usuario)
CREATE INDEX IF NOT EXISTS idx_recipes_user_id
ON recipetuner_recipes(user_id);

-- Índice para ordenar por fecha de creación
CREATE INDEX IF NOT EXISTS idx_recipes_created_at
ON recipetuner_recipes(created_at DESC);

-- Índice para filtrar favoritos
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite
ON recipetuner_recipes(user_id, is_favorite)
WHERE is_favorite = true;

-- Índice para filtrar recetas adaptadas
CREATE INDEX IF NOT EXISTS idx_recipes_is_adapted
ON recipetuner_recipes(user_id, is_adapted);

-- Índice compuesto para queries comunes
CREATE INDEX IF NOT EXISTS idx_recipes_user_created
ON recipetuner_recipes(user_id, created_at DESC);


-- ÍNDICES PARA TABLA: recipetuner_subscriptions
-- ----------------------------------------------

-- Índice para búsqueda por user_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
ON recipetuner_subscriptions(user_id);

-- Índice para filtrar suscripciones activas
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
ON recipetuner_subscriptions(user_id, status)
WHERE status = 'active';

-- Índice para búsqueda por stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
ON recipetuner_subscriptions(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;


-- ÍNDICES PARA TABLA: recipetuner_nutrition_info
-- ----------------------------------------------

-- Índice para búsqueda por recipe_id (join común)
CREATE INDEX IF NOT EXISTS idx_nutrition_recipe_id
ON recipetuner_nutrition_info(recipe_id);


-- ============================================
-- VERIFICAR ÍNDICES CREADOS
-- ============================================

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'recipetuner_%'
ORDER BY tablename, indexname;


-- ============================================
-- ANALIZAR TABLAS (actualizar estadísticas)
-- ============================================

ANALYZE recipetuner_users;
ANALYZE recipetuner_user_preferences;
ANALYZE recipetuner_recipes;
ANALYZE recipetuner_subscriptions;
ANALYZE recipetuner_nutrition_info;
ANALYZE recipetuner_subscription_plans;


-- ============================================
-- QUERIES DE PRUEBA DE PERFORMANCE (OPCIONAL)
-- ============================================
-- NOTA: Estos queries son OPCIONALES y solo para testing
-- Comenta/descomenta según necesites probar
-- ============================================

-- Test 1: Buscar usuario por auth_user_id (debería usar idx_users_auth_user_id)
-- Reemplaza 'YOUR-AUTH-USER-ID-HERE' con un auth_user_id real de tu tabla
/*
EXPLAIN ANALYZE
SELECT * FROM recipetuner_users
WHERE auth_user_id = 'YOUR-AUTH-USER-ID-HERE';
*/

-- Test 2: Buscar preferencias por user_id (debería usar idx_preferences_user_id)
-- Reemplaza 1 con un user_id real de tu tabla
/*
EXPLAIN ANALYZE
SELECT * FROM recipetuner_user_preferences
WHERE user_id = 1;
*/

-- Test 3: Listar recetas del usuario ordenadas (debería usar idx_recipes_user_created)
-- Reemplaza 1 con un user_id real de tu tabla
/*
EXPLAIN ANALYZE
SELECT * FROM recipetuner_recipes
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 20;
*/

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- - Todos los índices creados exitosamente
-- - Los queries de prueba muestran "Index Scan" en vez de "Seq Scan"
-- - Tiempo de ejecución de queries reducido significativamente
-- ============================================