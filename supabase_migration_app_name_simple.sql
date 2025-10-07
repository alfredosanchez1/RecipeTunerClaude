-- =====================================================
-- MIGRACIÓN SIMPLE: Agregar campo app_name a recipetuner_users
-- Versión compatible con Supabase
-- =====================================================

-- 1. Agregar la columna app_name si no existe
ALTER TABLE recipetuner_users
ADD COLUMN IF NOT EXISTS app_name TEXT DEFAULT 'recipetuner';

-- 2. Actualizar registros existentes que tengan NULL
UPDATE recipetuner_users
SET app_name = 'recipetuner'
WHERE app_name IS NULL;

-- 3. Hacer el campo NOT NULL después de actualizar los datos
ALTER TABLE recipetuner_users
ALTER COLUMN app_name SET NOT NULL;

-- 4. Crear índice compuesto para optimizar consultas por usuario + app
CREATE INDEX IF NOT EXISTS idx_users_auth_user_app
ON recipetuner_users (auth_user_id, app_name);

-- 5. Verificar que la migración se aplicó correctamente
SELECT
    'Migration Applied Successfully' as status,
    COUNT(*) as total_users,
    COUNT(DISTINCT app_name) as distinct_apps,
    COUNT(DISTINCT auth_user_id) as distinct_auth_users
FROM recipetuner_users;

-- 6. Mostrar estructura final
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recipetuner_users'
  AND column_name = 'app_name';

-- =====================================================
-- NOTA: El constraint único se agregará después manualmente si es necesario
-- Para agregarlo después, ejecuta:
--
-- ALTER TABLE recipetuner_users
-- ADD CONSTRAINT uk_users_auth_user_app
-- UNIQUE (auth_user_id, app_name);
-- =====================================================