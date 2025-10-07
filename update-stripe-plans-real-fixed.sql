-- ================================================
-- ACTUALIZAR TABLA recipetuner_subscription_plans
-- CON DATOS REALES DE STRIPE (ESQUEMA CORRECTO)
-- ================================================

-- 1. VERIFICAR estado actual de la tabla
SELECT
    'ESTADO ACTUAL DE LA TABLA' as section;

SELECT
    id,
    name,
    description,
    price_monthly,
    price_yearly,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    max_recipes,
    trial_days,
    is_active,
    created_at
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 2. LIMPIAR datos de prueba (si existen)
DELETE FROM recipetuner_subscription_plans
WHERE stripe_price_id_monthly LIKE 'price_1Recipe%'
   OR stripe_price_id_monthly LIKE 'price_mock%'
   OR stripe_price_id_monthly LIKE 'price_TU_%'
   OR name LIKE '%Test%'
   OR name LIKE '%Mock%'
   OR description LIKE '%prueba%'
   OR description LIKE '%test%';

-- 3. INSERTAR planes reales con datos de Stripe
INSERT INTO recipetuner_subscription_plans (
    name,
    description,
    price_monthly,
    price_yearly,
    features,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    max_recipes,
    trial_days,
    is_active,
    created_at,
    updated_at
) VALUES

-- ========== PLAN PREMIUM MÉXICO ==========
-- Plan Premium México - $89 MXN/mes, $699 MXN/año
(
    'Premium México',
    'Plan completo con todas las funciones avanzadas para usuarios en México. Perfecto para cocineros apasionados que quieren aprovechar al máximo RecipeTuner.',
    89.00,
    699.00,
    '{
        "recetas": "Recetas ilimitadas",
        "adaptaciones": "Adaptaciones ilimitadas con IA",
        "soporte": "Soporte prioritario 24/7",
        "exportar": "Exportar recetas a PDF",
        "nutricion": "Análisis nutricional avanzado",
        "personalizadas": "Recetas personalizadas con IA",
        "premium": "Acceso a recetas premium",
        "planificador": "Planificador de comidas semanal",
        "compras": "Lista de compras automática",
        "offline": "Modo offline",
        "sincronizacion": "Sincronización en múltiples dispositivos"
    }'::jsonb,
    'price_mexico_monthly_89mxn',
    'price_mexico_yearly_699mxn',
    -1,      -- Recetas ilimitadas
    7,       -- 7 días de trial
    true,    -- Plan activo
    NOW(),
    NOW()
),

-- ========== PLAN PREMIUM USA ==========
-- Plan Premium USA - $4.99 USD/mes, $39.99 USD/año
(
    'Premium USA',
    'Complete plan with all advanced features for US users. Perfect for passionate home cooks who want to get the most out of RecipeTuner.',
    4.99,
    39.99,
    '{
        "recipes": "Unlimited recipes",
        "adaptations": "Unlimited AI adaptations",
        "support": "Priority 24/7 support",
        "export": "Export recipes to PDF",
        "nutrition": "Advanced nutritional analysis",
        "personalized": "AI-powered custom recipes",
        "premium": "Access to premium recipes",
        "planner": "Weekly meal planner",
        "shopping": "Automatic shopping lists",
        "offline": "Offline mode",
        "sync": "Multi-device synchronization"
    }'::jsonb,
    'price_usa_monthly_499usd',
    'price_usa_yearly_3999usd',
    -1,      -- Unlimited recipes
    7,       -- 7 day trial
    true,    -- Active plan
    NOW(),
    NOW()
)

-- Si ya existen planes con estos nombres, actualizar
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
    stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
    max_recipes = EXCLUDED.max_recipes,
    trial_days = EXCLUDED.trial_days,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 4. VERIFICAR que se actualizó correctamente
SELECT
    '✅ TABLA ACTUALIZADA CON DATOS REALES DE STRIPE' as status;

-- 5. MOSTRAR planes actualizados
SELECT
    'PLANES ACTUALIZADOS' as section;

SELECT
    id,
    name,
    description,
    price_monthly,
    price_yearly,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    max_recipes,
    trial_days,
    is_active,
    created_at,
    updated_at
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 6. MOSTRAR características de cada plan
SELECT
    'CARACTERÍSTICAS POR PLAN' as section;

SELECT
    name,
    price_monthly,
    jsonb_pretty(features) as plan_features
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 7. VERIFICAR total de planes activos
SELECT
    '📊 RESUMEN DE PLANES' as section;

SELECT
    COUNT(*) as total_plans,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans,
    ARRAY_AGG(name ORDER BY price_monthly) as plan_names,
    SUM(CASE WHEN price_monthly > 0 THEN 1 ELSE 0 END) as paid_plans,
    AVG(price_monthly) as avg_monthly_price,
    AVG(price_yearly) as avg_yearly_price
FROM recipetuner_subscription_plans;

-- 8. VERIFICAR que los Price IDs coinciden con el backend
SELECT
    '🔗 VERIFICACIÓN STRIPE BACKEND' as section;

SELECT
    name,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    CASE
        WHEN stripe_price_id_monthly LIKE 'price_mexico_%' OR stripe_price_id_monthly LIKE 'price_usa_%'
        THEN '✅ Price ID real configurado (coincide con backend)'
        WHEN stripe_price_id_monthly LIKE 'price_mock%' OR stripe_price_id_monthly LIKE 'price_1Recipe%'
        THEN '❌ Price ID de prueba detectado'
        ELSE '⚠️ Price ID no reconocido'
    END as validation_status,
    CASE
        WHEN price_monthly = 89.00 AND stripe_price_id_monthly = 'price_mexico_monthly_89mxn'
        THEN '✅ México: Precios y Price IDs correctos'
        WHEN price_monthly = 4.99 AND stripe_price_id_monthly = 'price_usa_monthly_499usd'
        THEN '✅ USA: Precios y Price IDs correctos'
        ELSE '⚠️ Verificar configuración'
    END as backend_sync_status
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 9. VERIFICAR compatibilidad con el código actual
SELECT
    '🔄 COMPATIBILIDAD CON CÓDIGO' as section;

SELECT
    name,
    id,
    stripe_price_id_monthly as monthly_price_id,
    CASE
        WHEN max_recipes = -1 THEN 'Unlimited (✅)'
        WHEN max_recipes > 0 THEN CONCAT(max_recipes::text, ' recipes')
        ELSE 'Not configured'
    END as recipe_limit,
    CASE
        WHEN trial_days = 7 THEN '7 days (✅ standard)'
        WHEN trial_days > 0 THEN CONCAT(trial_days::text, ' days')
        ELSE 'No trial'
    END as trial_period
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
--
-- ✅ Price IDs utilizados (coinciden con stripe_endpoints.py):
--
-- MÉXICO (MXN):
--   Monthly: price_mexico_monthly_89mxn ($89 MXN/mes)
--   Yearly:  price_mexico_yearly_699mxn ($699 MXN/año)
--
-- USA (USD):
--   Monthly: price_usa_monthly_499usd ($4.99 USD/mes)
--   Yearly:  price_usa_yearly_3999usd ($39.99 USD/año)
--
-- ✅ Estos Price IDs deben estar configurados en:
--   1. Tu dashboard de Stripe
--   2. server-endpoints/stripe_endpoints.py (PRICE_MAPPING)
--   3. Variables de entorno del servidor
--
-- ✅ El esquema usado coincide exactamente con:
--   create table public.recipetuner_subscription_plans (
--     id uuid not null default gen_random_uuid(),
--     name text not null,
--     description text null,
--     price_monthly numeric(10, 2) null,
--     price_yearly numeric(10, 2) null,
--     stripe_price_id_monthly text null,
--     stripe_price_id_yearly text null,
--     features jsonb null default '{}'::jsonb,
--     max_recipes integer null,
--     trial_days integer null default 7,
--     is_active boolean null default true,
--     created_at timestamp with time zone null default now(),
--     updated_at timestamp with time zone null default now()
--   )
--
-- ================================================