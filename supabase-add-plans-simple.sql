-- Script simple para agregar planes de suscripción a RecipeTuner

-- 1. LIMPIAR planes existentes si los hay
DELETE FROM recipetuner_subscription_plans;

-- 2. INSERTAR planes de suscripción
INSERT INTO recipetuner_subscription_plans (
    name,
    description,
    price_monthly,
    price_yearly,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    features,
    max_recipes,
    trial_days,
    is_active
) VALUES
-- Plan Básico
(
    'Plan Básico',
    'Plan perfecto para comenzar con RecipeTuner. Ideal para uso personal.',
    99.00,
    999.00,
    'price_1RecipeBasicMXN_monthly',
    'price_1RecipeBasicMXN_yearly',
    '[
        "10 recetas por mes",
        "5 adaptaciones por día",
        "Soporte básico por email",
        "Acceso a biblioteca de recetas",
        "Guardado en la nube"
    ]'::jsonb,
    10,
    7,
    true
),
-- Plan Premium
(
    'Plan Premium',
    'Plan completo con todas las funciones avanzadas de RecipeTuner.',
    199.00,
    1999.00,
    'price_1RecipePremiumMXN_monthly',
    'price_1RecipePremiumMXN_yearly',
    '[
        "Recetas ilimitadas",
        "Adaptaciones ilimitadas",
        "Soporte prioritario 24/7",
        "Exportar a PDF",
        "Análisis nutricional avanzado",
        "Recetas personalizadas con IA",
        "Sincronización multi-dispositivo",
        "Acceso anticipado a nuevas funciones"
    ]'::jsonb,
    -1,
    14,
    true
),
-- Plan Familiar
(
    'Plan Familiar',
    'Plan diseñado para familias que aman cocinar juntas.',
    299.00,
    2999.00,
    'price_1RecipeFamilyMXN_monthly',
    'price_1RecipeFamilyMXN_yearly',
    '[
        "Todo lo del Plan Premium",
        "Hasta 5 perfiles familiares",
        "Planificador de menús semanal",
        "Lista de compras inteligente",
        "Recetas para diferentes edades",
        "Control parental",
        "Soporte telefónico prioritario"
    ]'::jsonb,
    -1,
    30,
    true
);

-- 3. VERIFICAR resultados
SELECT
    name,
    price_monthly,
    price_yearly,
    max_recipes,
    trial_days,
    is_active
FROM recipetuner_subscription_plans
ORDER BY price_monthly;

-- 4. CONTEO final
SELECT COUNT(*) as total_plans FROM recipetuner_subscription_plans WHERE is_active = true;