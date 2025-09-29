-- Script para solucionar errores de base de datos de RecipeTuner

-- 1. AGREGAR COLUMNA app_name a recipetuner_recipes (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='recipetuner_recipes'
                   AND column_name='app_name') THEN
        ALTER TABLE recipetuner_recipes ADD COLUMN app_name VARCHAR(50) DEFAULT 'recipetuner';
        RAISE NOTICE 'Columna app_name agregada a recipetuner_recipes';
    ELSE
        RAISE NOTICE 'Columna app_name ya existe en recipetuner_recipes';
    END IF;
END $$;

-- 2. ACTUALIZAR registros existentes para que tengan app_name
UPDATE recipetuner_recipes
SET app_name = 'recipetuner'
WHERE app_name IS NULL;

-- 3. VERIFICAR si la tabla recipetuner_user_preferences existe
CREATE TABLE IF NOT EXISTS recipetuner_user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES recipetuner_users(id) ON DELETE CASCADE,
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    intolerances JSONB DEFAULT '[]'::jsonb,
    medical_conditions JSONB DEFAULT '[]'::jsonb,
    cuisine_preferences JSONB DEFAULT '[]'::jsonb,
    cooking_time_preference VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. HABILITAR RLS en user_preferences si no está habilitado
ALTER TABLE recipetuner_user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICA para user_preferences (si no existe)
DROP POLICY IF EXISTS "Users can manage own preferences" ON recipetuner_user_preferences;
CREATE POLICY "Users can manage own preferences" ON recipetuner_user_preferences
    FOR ALL USING (
        user_id IN (
            SELECT id FROM recipetuner_users
            WHERE auth_user_id = auth.uid()
        )
    );

-- 6. VERIFICAR estructura de recipetuner_users
CREATE TABLE IF NOT EXISTS recipetuner_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    app_name VARCHAR(50) DEFAULT 'recipetuner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREAR ÍNDICES para mejorar performance
CREATE INDEX IF NOT EXISTS idx_recipes_app_name ON recipetuner_recipes(app_name);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON recipetuner_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON recipetuner_user_preferences(user_id);

-- 8. MOSTRAR RESUMEN
SELECT 'recipetuner_recipes' as tabla, COUNT(*) as registros FROM recipetuner_recipes
UNION ALL
SELECT 'recipetuner_users' as tabla, COUNT(*) as registros FROM recipetuner_users
UNION ALL
SELECT 'recipetuner_user_preferences' as tabla, COUNT(*) as registros FROM recipetuner_user_preferences
UNION ALL
SELECT 'recipetuner_subscription_plans' as tabla, COUNT(*) as registros FROM recipetuner_subscription_plans;

-- 9. VERIFICAR COLUMNAS DE recipetuner_recipes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'recipetuner_recipes'
ORDER BY ordinal_position;