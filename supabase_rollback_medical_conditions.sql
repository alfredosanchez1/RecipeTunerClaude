-- =====================================================
-- ROLLBACK: Revertir migración de medical_conditions
-- Fecha: 2025-01-21
-- Descripción: Script para revertir la adición del campo medical_conditions
-- ⚠️  CUIDADO: Este script eliminará datos permanentemente
-- =====================================================

-- 1. VERIFICAR DATOS ANTES DE ELIMINAR
-- Mostrar cuántos registros tienen condiciones médicas configuradas
SELECT
    'ANTES DEL ROLLBACK - Verificación de datos' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN medical_conditions != '[]'::json THEN 1 END) as records_with_medical_data,
    COUNT(CASE WHEN medical_conditions = '[]'::json OR medical_conditions IS NULL THEN 1 END) as records_without_medical_data
FROM recipetuner_user_preferences
WHERE EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recipetuner_user_preferences'
    AND column_name = 'medical_conditions'
);

-- 2. RESPALDAR DATOS (OPCIONAL - descomenta si quieres un respaldo)
/*
CREATE TABLE IF NOT EXISTS recipetuner_user_preferences_backup_medical AS
SELECT
    user_id,
    medical_conditions,
    updated_at
FROM recipetuner_user_preferences
WHERE medical_conditions != '[]'::json
AND medical_conditions IS NOT NULL;
*/

-- 3. ELIMINAR ÍNDICE
DROP INDEX IF EXISTS idx_user_preferences_medical_conditions;

-- 4. ELIMINAR CONSTRAINT
ALTER TABLE recipetuner_user_preferences
DROP CONSTRAINT IF EXISTS check_medical_conditions_is_array;

-- 5. ELIMINAR COLUMNA
ALTER TABLE recipetuner_user_preferences
DROP COLUMN IF EXISTS medical_conditions;

-- 6. VERIFICAR QUE EL ROLLBACK SE APLICÓ CORRECTAMENTE
SELECT
    'ROLLBACK COMPLETADO' as status,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'recipetuner_user_preferences'
            AND column_name = 'medical_conditions'
        )
        THEN '❌ ERROR: La columna medical_conditions aún existe'
        ELSE '✅ SUCCESS: La columna medical_conditions fue eliminada'
    END as verification_result;

-- 7. MOSTRAR ESTRUCTURA FINAL DE LA TABLA
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recipetuner_user_preferences'
ORDER BY ordinal_position;

-- =====================================================
-- FIN DEL ROLLBACK
-- =====================================================

-- NOTAS IMPORTANTES:
-- ⚠️  ESTE SCRIPT ELIMINARÁ PERMANENTEMENTE:
--     - La columna medical_conditions
--     - Todos los datos de condiciones médicas guardados
--     - El índice asociado
--     - Las validaciones (constraints)
--
-- 📄 RESPALDO:
--     - Descomenta la sección de respaldo si quieres guardar los datos
--     - El respaldo se creará en: recipetuner_user_preferences_backup_medical
--
-- 🔄 REVERSIBILIDAD:
--     - Para volver a aplicar la migración, ejecuta el archivo:
--       supabase_migration_medical_conditions.sql