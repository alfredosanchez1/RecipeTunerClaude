-- Script para forzar Row Level Security en recipetuner_subscription_plans

-- 1. Deshabilitar y volver a habilitar RLS para forzar actualización
ALTER TABLE recipetuner_subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipetuner_subscription_plans ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON recipetuner_subscription_plans;
DROP POLICY IF EXISTS "Only admins can view subscription plans" ON recipetuner_subscription_plans;
DROP POLICY IF EXISTS "Only admins can insert subscription plans" ON recipetuner_subscription_plans;
DROP POLICY IF EXISTS "Only admins can update subscription plans" ON recipetuner_subscription_plans;
DROP POLICY IF EXISTS "Only admins can delete subscription plans" ON recipetuner_subscription_plans;

-- 3. Verificar que la función is_admin existe, si no, crearla
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

-- 4. Crear políticas restrictivas (SOLO administradores)
CREATE POLICY "Admin only - SELECT" ON recipetuner_subscription_plans
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin only - INSERT" ON recipetuner_subscription_plans
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin only - UPDATE" ON recipetuner_subscription_plans
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin only - DELETE" ON recipetuner_subscription_plans
    FOR DELETE USING (is_admin());

-- 5. Verificar que el administrador existe
INSERT INTO recipetuner_admins (email)
VALUES ('luiscazaress@gmail.com')
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- 6. Mostrar el estado final
SELECT 'RLS Status' as check_type,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables
WHERE tablename = 'recipetuner_subscription_plans';

SELECT 'Policy Count' as check_type,
       COUNT(*)::text as status
FROM pg_policies
WHERE tablename = 'recipetuner_subscription_plans';

SELECT 'Admin Count' as check_type,
       COUNT(*)::text as status
FROM recipetuner_admins
WHERE is_active = true;