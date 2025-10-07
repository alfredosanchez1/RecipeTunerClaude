-- =====================================================
-- MIGRACIÓN: Agregar campo app_name a recipetuner_users
-- Fecha: 2025-01-21
-- Descripción: Permitir múltiples perfiles por usuario en diferentes apps
-- =====================================================

-- 1. Verificar estado actual de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recipetuner_users'
ORDER BY ordinal_position;

-- 2. Agregar la columna app_name si no existe
ALTER TABLE recipetuner_users
ADD COLUMN IF NOT EXISTS app_name TEXT DEFAULT 'recipetuner';

-- 3. Actualizar registros existentes que tengan NULL
UPDATE recipetuner_users
SET app_name = 'recipetuner'
WHERE app_name IS NULL;

-- 4. Hacer el campo NOT NULL después de actualizar los datos
ALTER TABLE recipetuner_users
ALTER COLUMN app_name SET NOT NULL;

-- 5. Agregar comentario para documentar el campo
COMMENT ON COLUMN recipetuner_users.app_name IS
'Identificador de la aplicación. Permite que el mismo usuario tenga perfiles en múltiples apps usando el mismo email.';

-- 6. Crear índice compuesto para optimizar consultas por usuario + app
CREATE INDEX IF NOT EXISTS idx_users_auth_user_app
ON recipetuner_users (auth_user_id, app_name);

-- 7. Agregar constraint único para evitar duplicados por auth_user_id + app_name
-- Nota: Si el constraint ya existe, este comando fallará pero no afectará la migración
DO $$
BEGIN
    ALTER TABLE recipetuner_users
    ADD CONSTRAINT uk_users_auth_user_app
    UNIQUE (auth_user_id, app_name);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint uk_users_auth_user_app ya existe, continuando...';
END $$;

-- 8. Verificar que la migración se aplicó correctamente
SELECT
    'Migration Applied Successfully' as status,
    COUNT(*) as total_users,
    COUNT(DISTINCT app_name) as distinct_apps,
    COUNT(DISTINCT auth_user_id) as distinct_auth_users
FROM recipetuner_users;

-- 9. Mostrar estructura final de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name = 'app_name' THEN '✅ NUEVO CAMPO'
        ELSE ''
    END as notes
FROM information_schema.columns
WHERE table_name = 'recipetuner_users'
ORDER BY ordinal_position;

-- 10. Ejemplo: Ver usuarios por app (descomenta para probar)
/*
SELECT
    app_name,
    COUNT(*) as user_count,
    array_agg(DISTINCT email) as emails
FROM recipetuner_users
GROUP BY app_name
ORDER BY app_name;
*/

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

-- BENEFICIOS DE ESTA MIGRACIÓN:
-- ✅ Permite múltiples apps con el mismo email
-- ✅ Separación limpia entre aplicaciones
-- ✅ Queries optimizadas con índices
-- ✅ Previene duplicados con constraint único
-- ✅ Compatible con datos existentes