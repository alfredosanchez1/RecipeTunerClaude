-- ============================================
-- Script: Asegurar RLS correcto en recipetuner_user_preferences
-- Fecha: 2025-09-29
-- Propósito: Garantizar que las políticas RLS funcionen con diet_type
-- ============================================

-- PASO 1: Habilitar RLS si no está habilitado
ALTER TABLE recipetuner_user_preferences ENABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar políticas antiguas si existen (para recrearlas limpias)
DROP POLICY IF EXISTS "Users can view their own preferences" ON recipetuner_user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON recipetuner_user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON recipetuner_user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON recipetuner_user_preferences;

-- PASO 3: Crear políticas RLS correctas
-- Política SELECT: Los usuarios solo pueden ver sus propias preferencias
CREATE POLICY "Users can view their own preferences"
ON recipetuner_user_preferences
FOR SELECT
USING (
    user_id IN (
        SELECT id FROM recipetuner_users
        WHERE auth_user_id = auth.uid()
    )
);

-- Política INSERT: Los usuarios pueden crear sus propias preferencias
CREATE POLICY "Users can insert their own preferences"
ON recipetuner_user_preferences
FOR INSERT
WITH CHECK (
    user_id IN (
        SELECT id FROM recipetuner_users
        WHERE auth_user_id = auth.uid()
    )
);

-- Política UPDATE: Los usuarios pueden actualizar sus propias preferencias
CREATE POLICY "Users can update their own preferences"
ON recipetuner_user_preferences
FOR UPDATE
USING (
    user_id IN (
        SELECT id FROM recipetuner_users
        WHERE auth_user_id = auth.uid()
    )
)
WITH CHECK (
    user_id IN (
        SELECT id FROM recipetuner_users
        WHERE auth_user_id = auth.uid()
    )
);

-- Política DELETE: Los usuarios pueden eliminar sus propias preferencias
CREATE POLICY "Users can delete their own preferences"
ON recipetuner_user_preferences
FOR DELETE
USING (
    user_id IN (
        SELECT id FROM recipetuner_users
        WHERE auth_user_id = auth.uid()
    )
);

-- PASO 4: Verificar que todo quedó correcto
SELECT
    policyname,
    cmd as command,
    'Configured' as status
FROM pg_policies
WHERE tablename = 'recipetuner_user_preferences'
ORDER BY policyname;

-- ============================================
-- NOTAS:
-- ============================================
-- - Estas políticas permiten a cada usuario:
--   * Leer solo sus propias preferencias (incluido diet_type)
--   * Crear sus preferencias iniciales
--   * Actualizar sus preferencias (UPSERT compatible)
--   * Eliminar sus preferencias si lo desean
--
-- - Las políticas usan auth.uid() de Supabase para verificar
--   que el usuario autenticado es el dueño de las preferencias
--
-- - Compatible con la migración diet_type (no específica columnas)
-- ============================================