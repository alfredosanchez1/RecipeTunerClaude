-- Script para verificar el estado de RLS en recipetuner_subscription_plans

-- 1. Verificar si RLS está habilitado
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'recipetuner_subscription_plans';

-- 2. Verificar políticas existentes
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'recipetuner_subscription_plans';

-- 3. Verificar si la tabla de administradores existe
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'recipetuner_admins'
) as admin_table_exists;

-- 4. Verificar administradores existentes (si la tabla existe)
SELECT email, is_active, created_at
FROM recipetuner_admins
WHERE is_active = true;

-- 5. Verificar si la función is_admin existe
SELECT EXISTS (
    SELECT 1
    FROM information_schema.routines
    WHERE routine_name = 'is_admin'
) as is_admin_function_exists;