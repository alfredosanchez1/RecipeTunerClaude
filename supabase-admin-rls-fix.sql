-- Solucion para Row Level Security en recipetuner_subscription_plans
-- Solo administradores deben tener acceso completo a esta tabla

-- 1. Primero eliminar la política existente que permite acceso público
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON recipetuner_subscription_plans;

-- 2. Crear una tabla de administradores (si no existe)
CREATE TABLE IF NOT EXISTS recipetuner_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  auth_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 3. Habilitar RLS en la tabla de administradores
ALTER TABLE recipetuner_admins ENABLE ROW LEVEL SECURITY;

-- 4. Política para que solo los administradores puedan ver la tabla de administradores
CREATE POLICY "Only admins can view admin table" ON recipetuner_admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipetuner_admins
            WHERE email = auth.jwt() ->> 'email'
            AND is_active = true
        )
    );

-- 5. Crear función helper para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM recipetuner_admins
        WHERE email = auth.jwt() ->> 'email'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Nuevas políticas para recipetuner_subscription_plans - SOLO ADMINISTRADORES
CREATE POLICY "Only admins can view subscription plans" ON recipetuner_subscription_plans
    FOR SELECT USING (is_admin());

CREATE POLICY "Only admins can insert subscription plans" ON recipetuner_subscription_plans
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update subscription plans" ON recipetuner_subscription_plans
    FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete subscription plans" ON recipetuner_subscription_plans
    FOR DELETE USING (is_admin());

-- 7. Insertar el primer administrador
INSERT INTO recipetuner_admins (email)
VALUES ('luiscazaress@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 8. Crear política para permitir a administradores insertar otros administradores
CREATE POLICY "Admins can manage other admins" ON recipetuner_admins
    FOR ALL USING (is_admin());

-- 9. Índice para optimizar las consultas de administradores
CREATE INDEX IF NOT EXISTS idx_admins_email ON recipetuner_admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON recipetuner_admins(is_active);

-- NOTAS DE USO:
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Después de ejecutar, solo los administradores podrán acceder a recipetuner_subscription_plans
-- 3. luiscazaress@gmail.com será configurado como administrador principal
-- 4. Para agregar más administradores, usar: INSERT INTO recipetuner_admins (email) VALUES ('nuevo-admin@email.com');