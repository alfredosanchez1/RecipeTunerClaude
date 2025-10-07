-- Script de diagnóstico para problema de login
-- Usuario: luiscazares@losmolinoscafe.com
-- Auth ID: 245b9a43-7af3-4a26-90c2-081a1f21984f

-- 1. Verificar que el usuario existe en auth.users
SELECT
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE id = '245b9a43-7af3-4a26-90c2-081a1f21984f';

-- 2. Verificar que el perfil existe en recipetuner_users (sin RLS)
SELECT
    id,
    auth_user_id,
    email,
    name,
    app_name,
    created_at
FROM recipetuner_users
WHERE auth_user_id = '245b9a43-7af3-4a26-90c2-081a1f21984f';

-- 3. Verificar las policies de SELECT en recipetuner_users
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
WHERE tablename = 'recipetuner_users'
AND cmd = 'SELECT';

-- 4. Simular la query que hace la app cuando hace login
-- Esta query debería devolver el perfil cuando auth.uid() = '245b9a43-7af3-4a26-90c2-081a1f21984f'
-- NOTA: Esta query NO funcionará en SQL Editor porque auth.uid() estará vacío
-- Es solo para mostrar la query que se ejecuta
/*
SELECT *
FROM recipetuner_users
WHERE auth_user_id = auth.uid()
AND app_name = 'recipetuner';
*/

-- 5. Verificar si hay algún problema con constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS referenced_column
FROM pg_constraint AS c
JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
LEFT JOIN pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.conrelid = 'recipetuner_users'::regclass;
