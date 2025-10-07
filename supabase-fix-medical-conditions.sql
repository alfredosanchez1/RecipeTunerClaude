-- Agregar columna medical_conditions a la tabla user_preferences
ALTER TABLE recipetuner_user_preferences
ADD COLUMN medical_conditions jsonb DEFAULT '[]';

-- Comentario sobre la columna
COMMENT ON COLUMN recipetuner_user_preferences.medical_conditions IS 'Condiciones médicas del usuario en formato JSON array';