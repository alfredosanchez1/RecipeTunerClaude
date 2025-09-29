/* Rollback: Revertir cambio de diet_type a cuisine_preferences */
/* Fecha: 2025-09-29 */
/* Descripción: Revertir cambio de tipo de dieta único a array de preferencias de cocina */

/* Paso 1: Agregar de vuelta columna cuisine_preferences */
ALTER TABLE recipetuner_user_preferences
ADD COLUMN cuisine_preferences TEXT[] DEFAULT '{}';

/* Paso 2: Migrar datos de diet_type de vuelta a cuisine_preferences (como array) */
UPDATE recipetuner_user_preferences
SET cuisine_preferences = CASE
  WHEN diet_type != '' AND diet_type IS NOT NULL
  THEN ARRAY[diet_type]
  ELSE '{}'::TEXT[]
END;

/* Paso 3: Eliminar columna diet_type */
ALTER TABLE recipetuner_user_preferences
DROP COLUMN diet_type;

/* Paso 4: Verificar estructura */
/*
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'recipetuner_user_preferences'
ORDER BY ordinal_position;
*/