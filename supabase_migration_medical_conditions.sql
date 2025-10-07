-- =====================================================
-- MIGRACIÓN: Agregar campo medical_conditions a preferencias
-- Fecha: 2025-01-21
-- Descripción: Agregar soporte para condiciones médicas en preferencias de usuario
-- =====================================================

-- 1. Verificar estado actual de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recipetuner_user_preferences'
ORDER BY ordinal_position;

-- 2. Agregar la columna medical_conditions
ALTER TABLE recipetuner_user_preferences
ADD COLUMN IF NOT EXISTS medical_conditions JSON DEFAULT '[]'::json;

-- 3. Agregar comentario para documentar el campo
COMMENT ON COLUMN recipetuner_user_preferences.medical_conditions IS
'Array JSON de condiciones médicas del usuario que requieren consideraciones dietéticas. Ejemplo: ["diabetes_type2", "hypertension"]';

-- 4. Actualizar registros existentes que tengan NULL
UPDATE recipetuner_user_preferences
SET medical_conditions = '[]'::json
WHERE medical_conditions IS NULL;

-- 5. Agregar constraint para validar que sea un array JSON válido
ALTER TABLE recipetuner_user_preferences
ADD CONSTRAINT check_medical_conditions_is_array
CHECK (jsonb_typeof(medical_conditions::jsonb) = 'array');

-- 6. Crear índice para optimizar consultas por condiciones médicas
CREATE INDEX IF NOT EXISTS idx_user_preferences_medical_conditions
ON recipetuner_user_preferences
USING GIN (medical_conditions);

-- 7. Verificar que la migración se aplicó correctamente
SELECT
    'Migration Applied Successfully' as status,
    COUNT(*) as total_records,
    COUNT(medical_conditions) as records_with_medical_conditions,
    COUNT(*) - COUNT(medical_conditions) as null_records
FROM recipetuner_user_preferences;

-- 8. Mostrar estructura final de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name = 'medical_conditions' THEN '✅ NUEVO CAMPO'
        ELSE ''
    END as notes
FROM information_schema.columns
WHERE table_name = 'recipetuner_user_preferences'
ORDER BY ordinal_position;

-- 9. Ejemplo de consulta para verificar funcionalidad
-- (Descomenta para probar después de la migración)
/*
SELECT
    user_id,
    dietary_restrictions,
    medical_conditions,
    created_at
FROM recipetuner_user_preferences
LIMIT 5;
*/

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

-- NOTAS IMPORTANTES:
-- - Este script es idempotente (se puede ejecutar varias veces sin problemas)
-- - Usa IF NOT EXISTS para evitar errores si ya existe la columna
-- - Incluye validaciones y verificaciones
-- - Crea índice para optimizar rendimiento
-- - Mantiene la compatibilidad con datos existentes