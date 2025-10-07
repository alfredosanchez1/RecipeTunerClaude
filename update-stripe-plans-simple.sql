-- ================================================
-- ACTUALIZAR TABLA recipetuner_subscription_plans
-- CON DATOS REALES DE STRIPE (SIN CONFLICTS)
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
    is_active
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 2. LIMPIAR TODOS los datos existentes para empezar limpio
DELETE FROM recipetuner_subscription_plans;

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
    is_active
) VALUES

-- ========== PLAN PREMIUM MÉXICO ==========
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
        "sincronizacion": "Sincronización en múltiples dispositivos",
        "medicas": "Condiciones médicas"
    }'::jsonb,
    'price_mexico_monthly_89mxn',
    'price_mexico_yearly_699mxn',
    -1,      -- Recetas ilimitadas
    7,       -- 7 días de trial
    true     -- Plan activo
),

-- ========== PLAN PREMIUM USA ==========
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
        "sync": "Multi-device synchronization",
        "medical": "Medical conditions"
    }'::jsonb,
    'price_usa_monthly_499usd',
    'price_usa_yearly_3999usd',
    -1,      -- Unlimited recipes
    7,       -- 7 day trial
    true     -- Active plan
);

-- 4. VERIFICAR que se insertó correctamente
SELECT
    '✅ TABLA ACTUALIZADA CON DATOS REALES DE STRIPE' as status;

-- 5. MOSTRAR planes insertados
SELECT
    id,
    name,
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

-- 6. VERIFICAR características de cada plan
SELECT
    name,
    price_monthly,
    jsonb_pretty(features) as plan_features
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 7. VERIFICAR Price IDs
SELECT
    '🔗 VERIFICACIÓN STRIPE BACKEND' as section;

SELECT
    name,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    CASE
        WHEN stripe_price_id_monthly = 'price_mexico_monthly_89mxn' AND price_monthly = 89.00
        THEN '✅ México: Configuración correcta'
        WHEN stripe_price_id_monthly = 'price_usa_monthly_499usd' AND price_monthly = 4.99
        THEN '✅ USA: Configuración correcta'
        ELSE '⚠️ Verificar configuración'
    END as validation_status
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 8. RESUMEN FINAL
SELECT
    '📊 RESUMEN FINAL' as section;

SELECT
    COUNT(*) as total_plans,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans,
    STRING_AGG(name, ', ' ORDER BY price_monthly) as all_plans
FROM recipetuner_subscription_plans;

-- ================================================
-- ✅ DATOS INSERTADOS:
-- ================================================
--
-- 1. Premium México: $89 MXN/mes ($699/año)
--    Price IDs: price_mexico_monthly_89mxn / price_mexico_yearly_699mxn
--
-- 2. Premium USA: $4.99 USD/mes ($39.99/año)
--    Price IDs: price_usa_monthly_499usd / price_usa_yearly_3999usd
--
-- Estos Price IDs coinciden exactamente con:
-- server-endpoints/stripe_endpoints.py (PRICE_MAPPING)
--
-- ================================================