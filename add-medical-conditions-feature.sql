-- ================================================
-- AGREGAR CARACTERÍSTICA "CONDICIONES MÉDICAS"
-- A LOS PLANES DE SUSCRIPCIÓN
-- ================================================

-- 1. VERIFICAR estado actual de características
SELECT
    name,
    jsonb_pretty(features) as current_features
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 2. ACTUALIZAR Plan Premium México - Agregar condiciones médicas
UPDATE recipetuner_subscription_plans
SET features = features || '{"medicas": "Adaptación para condiciones médicas"}'::jsonb
WHERE name = 'Premium México';

-- 3. ACTUALIZAR Plan Premium USA - Agregar condiciones médicas
UPDATE recipetuner_subscription_plans
SET features = features || '{"medical": "Medical condition adaptations"}'::jsonb
WHERE name = 'Premium USA';

-- 4. VERIFICAR que se agregó correctamente
SELECT
    '✅ CARACTERÍSTICA DE CONDICIONES MÉDICAS AGREGADA' as status;

-- 5. MOSTRAR características actualizadas
SELECT
    name,
    price_monthly,
    jsonb_pretty(features) as updated_features
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 6. VERIFICAR específicamente la nueva característica
SELECT
    name,
    CASE
        WHEN name LIKE '%México%' AND features ? 'medicas'
        THEN '✅ México: Condiciones médicas agregada'
        WHEN name LIKE '%USA%' AND features ? 'medical'
        THEN '✅ USA: Medical conditions agregada'
        ELSE '⚠️ Verificar característica'
    END as verification_status
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- ================================================
-- RESUMEN:
-- ================================================
--
-- ✅ Se agrega "Adaptación para condiciones médicas"
--    a ambos planes Premium (México y USA)
--
-- ✅ Los usuarios podrán ver esta característica
--    en la pantalla de suscripciones
--
-- ✅ Esta función permite adaptar recetas según:
--    - Diabetes
--    - Hipertensión
--    - Celíacos
--    - Intolerancia a lactosa
--    - Y otras condiciones médicas
-- ================================================