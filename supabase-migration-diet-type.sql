/* Migración: Reemplazar cuisine_preferences por diet_type */
/* Fecha: 2025-09-29 */
/* Descripción: Cambiar de array de preferencias de cocina a selección única de tipo de dieta */

/* Paso 1: Agregar nueva columna diet_type */
ALTER TABLE recipetuner_user_preferences
ADD COLUMN diet_type TEXT DEFAULT '';

/* Paso 2: Migrar datos existentes (mapear primer elemento de cuisine_preferences si existe) */
UPDATE recipetuner_user_preferences
SET diet_type = CASE
  WHEN array_length(cuisine_preferences, 1) > 0
  THEN cuisine_preferences[1]
  ELSE ''
END;

/* Paso 3: Eliminar columna antigua cuisine_preferences */
ALTER TABLE recipetuner_user_preferences
DROP COLUMN cuisine_preferences;

/* Paso 4: Verificar estructura final */
/*
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'recipetuner_user_preferences'
ORDER BY ordinal_position;
*/