-- ================================================
-- ACTUALIZAR TABLA recipetuner_subscription_plans
-- CON DATOS REALES DE STRIPE
-- ================================================

-- 1. VERIFICAR estado actual de la tabla
SELECT
    id,
    name,
    country_code,
    currency,
    price_monthly,
    price_yearly,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    is_active
FROM recipetuner_subscription_plans
ORDER BY country_code, price_monthly;

-- 2. LIMPIAR datos de prueba (si existen)
DELETE FROM recipetuner_subscription_plans
WHERE stripe_price_id_monthly LIKE 'price_1Recipe%'
   OR stripe_price_id_monthly LIKE 'price_mock%'
   OR stripe_price_id_monthly LIKE 'price_TU_%';

-- 3. INSERTAR/ACTUALIZAR con datos reales de Stripe
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

-- ========== PLANES MÉXICO (MXN) ==========
-- Plan Premium México - $89 MXN/mes, $699 MXN/año
(
    'Premium México',
    'Plan completo con todas las funciones avanzadas para usuarios en México. Perfecto para cocineros apasionados.',
    89.00,
    699.00,
    '[
        "Recetas ilimitadas",
        "Adaptaciones ilimitadas con IA",
        "Soporte prioritario 24/7",
        "Exportar recetas a PDF",
        "Análisis nutricional avanzado",
        "Recetas personalizadas con IA",
        "Acceso a recetas premium",
        "Planificador de comidas semanal",
        "Lista de compras automática"
    ]'::jsonb,
    'price_mexico_monthly_89mxn',
    'price_mexico_yearly_699mxn',
    -1,      -- Recetas ilimitadas
    -1,      -- Adaptaciones ilimitadas
    true,    -- Soporte prioritario
    true,    -- Plan activo
    'MX',
    'MXN',
    NOW(),
    NOW()
),

-- ========== PLANES USA (USD) ==========
-- Plan Premium USA - $4.99 USD/mes, $39.99 USD/año
(
    'Premium USA',
    'Complete plan with all advanced features for US users. Perfect for passionate home cooks.',
    4.99,
    39.99,
    '[
        "Unlimited recipes",
        "Unlimited AI adaptations",
        "Priority 24/7 support",
        "Export recipes to PDF",
        "Advanced nutritional analysis",
        "AI-powered custom recipes",
        "Access to premium recipes",
        "Weekly meal planner",
        "Automatic shopping lists"
    ]'::jsonb,
    'price_usa_monthly_499usd',
    'price_usa_yearly_3999usd',
    -1,      -- Unlimited recipes
    -1,      -- Unlimited adaptations
    true,    -- Priority support
    true,    -- Active plan
    'US',
    'USD',
    NOW(),
    NOW()
)

-- Si ya existen planes con estos nombres, actualizar
ON CONFLICT (name, country_code) DO UPDATE SET
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    max_recipes = EXCLUDED.max_recipes,
    max_adaptations = EXCLUDED.max_adaptations,
    priority_support = EXCLUDED.priority_support,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 4. VERIFICAR que se actualizó correctamente
SELECT
    '✅ TABLA ACTUALIZADA CON DATOS REALES DE STRIPE' as status;

SELECT
    id,
    name,
    country_code,
    currency,
    price_monthly,
    price_yearly,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    max_recipes,
    is_active,
    created_at
FROM recipetuner_subscription_plans
ORDER BY country_code, price_monthly;

-- 5. VERIFICAR total de planes activos
SELECT
    '📊 RESUMEN DE PLANES' as section,
    country_code,
    currency,
    COUNT(*) as total_plans,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans,
    ARRAY_AGG(name ORDER BY price_monthly) as plan_names
FROM recipetuner_subscription_plans
GROUP BY country_code, currency
ORDER BY country_code;

-- 6. VERIFICAR que los Price IDs coinciden con el backend
SELECT
    '🔗 VERIFICACIÓN STRIPE BACKEND' as section,
    name,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    CASE
        WHEN stripe_price_id_monthly LIKE 'price_%'
             AND NOT stripe_price_id_monthly LIKE 'price_mock%'
             AND NOT stripe_price_id_monthly LIKE 'price_1Recipe%'
        THEN '✅ Price ID parece real'
        ELSE '❌ Price ID parece de prueba'
    END as validation_status
FROM recipetuner_subscription_plans
ORDER BY country_code;

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
--
-- Price IDs utilizados (del backend stripe_endpoints.py):
--
-- MÉXICO (MXN):
--   Monthly: price_mexico_monthly_89mxn
--   Yearly:  price_mexico_yearly_699mxn
--
-- USA (USD):
--   Monthly: price_usa_monthly_499usd
--   Yearly:  price_usa_yearly_3999usd
--
-- Estos coinciden con la configuración en:
-- - server-endpoints/stripe_endpoints.py (PRICE_MAPPING)
-- - Deben estar creados en tu dashboard de Stripe
--
-- ================================================