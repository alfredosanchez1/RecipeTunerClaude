-- Script para agregar planes de suscripción de prueba a RecipeTuner

-- 1. VERIFICAR si la tabla recipetuner_subscription_plans existe y su estructura
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recipetuner_subscription_plans'
ORDER BY ordinal_position;

-- 2. LIMPIAR planes existentes (opcional)
-- DELETE FROM recipetuner_subscription_plans WHERE name LIKE '%Test%';

-- 3. INSERTAR planes de suscripción de prueba para RecipeTuner
INSERT INTO recipetuner_subscription_plans (
    name,
    description,
    price_monthly,
    price_yearly,
    features,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    max_recipes,
    max_adaptations,
    priority_support,
    is_active,
    country_code,
    currency,
    created_at,
    updated_at
) VALUES
-- Plan Básico México
(
    'Básico',
    'Plan perfecto para comenzar con RecipeTuner',
    99.00,
    999.00,
    '["10 recetas por mes", "5 adaptaciones por día", "Soporte básico", "Acceso a biblioteca de recetas"]'::jsonb,
    'price_1RecipeBasicMXN_monthly',
    'price_1RecipeBasicMXN_yearly',
    10,
    5,
    false,
    true,
    'MX',
    'MXN',
    NOW(),
    NOW()
),
-- Plan Premium México
(
    'Premium',
    'Plan completo con todas las funciones avanzadas',
    199.00,
    1999.00,
    '["Recetas ilimitadas", "Adaptaciones ilimitadas", "Soporte prioritario", "Exportar a PDF", "Análisis nutricional avanzado", "Recetas personalizadas con IA"]'::jsonb,
    'price_1RecipePremiumMXN_monthly',
    'price_1RecipePremiumMXN_yearly',
    -1,
    -1,
    true,
    true,
    'MX',
    'MXN',
    NOW(),
    NOW()
),
-- Plan Básico USA
(
    'Basic',
    'Perfect plan to get started with RecipeTuner',
    5.99,
    59.99,
    '["10 recipes per month", "5 adaptations per day", "Basic support", "Access to recipe library"]'::jsonb,
    'price_1RecipeBasicUSD_monthly',
    'price_1RecipeBasicUSD_yearly',
    10,
    5,
    false,
    true,
    'US',
    'USD',
    NOW(),
    NOW()
),
-- Plan Premium USA
(
    'Premium',
    'Complete plan with all advanced features',
    11.99,
    119.99,
    '["Unlimited recipes", "Unlimited adaptations", "Priority support", "PDF export", "Advanced nutritional analysis", "AI-powered custom recipes"]'::jsonb,
    'price_1RecipePremiumUSD_monthly',
    'price_1RecipePremiumUSD_yearly',
    -1,
    -1,
    true,
    true,
    'US',
    'USD',
    NOW(),
    NOW()
)
ON CONFLICT (name, country_code) DO UPDATE SET
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    updated_at = NOW();

-- 4. VERIFICAR que se insertaron correctamente
SELECT
    id,
    name,
    country_code,
    currency,
    price_monthly,
    price_yearly,
    is_active,
    created_at
FROM recipetuner_subscription_plans
ORDER BY country_code, price_monthly;

-- 5. CONTAR total de planes
SELECT
    country_code,
    currency,
    COUNT(*) as total_plans,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans
FROM recipetuner_subscription_plans
GROUP BY country_code, currency;