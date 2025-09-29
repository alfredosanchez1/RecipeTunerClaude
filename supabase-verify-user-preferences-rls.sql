-- ============================================
-- Script de Verificación: RLS en recipetuner_user_preferences
-- Fecha: 2025-09-29
-- Propósito: Verificar políticas de seguridad después de migración diet_type
-- ============================================

-- 1. Verificar si RLS está habilitado en la tabla
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'recipetuner_user_preferences';

-- 2. Verificar políticas existentes para la tabla
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'recipetuner_user_preferences'
ORDER BY policyname;

-- 3. Verificar columnas de la tabla (incluir diet_type)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recipetuner_user_preferences'
ORDER BY ordinal_position;

-- 4. Verificar si existe la columna diet_type
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recipetuner_user_preferences'
    AND column_name = 'diet_type'
) as diet_type_column_exists;

-- 5. Verificar que NO existe la columna cuisine_preferences (debe estar eliminada)
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recipetuner_user_preferences'
    AND column_name = 'cuisine_preferences'
) as cuisine_preferences_still_exists;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- 1. rls_enabled = TRUE
-- 2. Políticas existentes deben incluir:
--    - SELECT: Los usuarios pueden leer sus propias preferencias
--    - INSERT: Los usuarios pueden crear sus preferencias
--    - UPDATE: Los usuarios pueden actualizar sus preferencias
--    - DELETE: Los usuarios pueden eliminar sus preferencias
-- 3. diet_type debe existir como TEXT
-- 4. cuisine_preferences NO debe existir
-- ============================================