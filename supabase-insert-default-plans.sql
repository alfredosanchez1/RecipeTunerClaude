-- ============================================
-- Script: Insertar Planes de Suscripción por Defecto
-- Fecha: 2025-09-29
-- Propósito: Crear planes FREE, BASIC, PREMIUM, PRO
-- ============================================

-- NOTA: Estos son valores de ejemplo
-- Necesitas reemplazar los stripe_price_id con los REALES de tu cuenta Stripe

-- 1. Plan FREE (siempre disponible)
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
) VALUES (
    'Free',
    'Plan gratuito con funcionalidades básicas',
    0.00,
    0.00,
    NULL, -- No requiere Stripe
    NULL,
    '["10 recetas", "Adaptación básica con IA", "Búsqueda de recetas"]'::jsonb,
    10,
    0, -- Sin trial
    true
)
ON CONFLICT DO NOTHING;

-- 2. Plan BASIC
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
) VALUES (
    'Basic',
    'Plan básico con más recetas y funciones',
    4.99,
    49.99, -- ~$4.16/mes (ahorro de 17%)
    'price_XXXXXXXXXXXXX', -- ⚠️ REEMPLAZAR con tu Stripe Price ID mensual
    'price_YYYYYYYYYYY',   -- ⚠️ REEMPLAZAR con tu Stripe Price ID anual
    '["50 recetas", "Adaptación avanzada con IA", "Exportar a PDF", "Soporte prioritario"]'::jsonb,
    50,
    7, -- 7 días de trial
    true
)
ON CONFLICT DO NOTHING;

-- 3. Plan PREMIUM
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
) VALUES (
    'Premium',
    'Plan premium con recetas ilimitadas',
    9.99,
    99.99, -- ~$8.33/mes (ahorro de 17%)
    'price_ZZZZZZZZZZZ', -- ⚠️ REEMPLAZAR con tu Stripe Price ID mensual
    'price_AAAAAAAAAAA', -- ⚠️ REEMPLAZAR con tu Stripe Price ID anual
    '["Recetas ilimitadas", "IA avanzada", "Análisis nutricional", "Planes de comida", "Sin anuncios", "Soporte premium 24/7"]'::jsonb,
    999999, -- Ilimitado
    14, -- 14 días de trial
    true
)
ON CONFLICT DO NOTHING;

-- 4. Plan PRO (opcional - para usuarios profesionales)
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
) VALUES (
    'Pro',
    'Plan profesional para chefs y nutricionistas',
    19.99,
    199.99, -- ~$16.66/mes (ahorro de 17%)
    'price_BBBBBBBBBBB', -- ⚠️ REEMPLAZAR con tu Stripe Price ID mensual
    'price_CCCCCCCCCCC', -- ⚠️ REEMPLAZAR con tu Stripe Price ID anual
    '["Todo en Premium", "API access", "Múltiples usuarios", "Marca personalizada", "Análisis avanzado", "Soporte dedicado"]'::jsonb,
    999999, -- Ilimitado
    30, -- 30 días de trial
    true
)
ON CONFLICT DO NOTHING;

-- Verificar planes insertados
SELECT
    name,
    price_monthly,
    price_yearly,
    max_recipes,
    trial_days,
    is_active
FROM recipetuner_subscription_plans
ORDER BY price_monthly NULLS FIRST;

-- ============================================
-- CÓMO OBTENER LOS STRIPE PRICE IDs:
-- ============================================
-- 1. Ir a https://dashboard.stripe.com/products
-- 2. Crear un producto para cada plan
-- 3. Crear dos precios por producto:
--    - Uno mensual (recurring: monthly)
--    - Uno anual (recurring: yearly)
-- 4. Copiar los Price IDs (formato: price_xxxxxxxxxxxxx)
-- 5. Reemplazar en este script
-- 6. Ejecutar de nuevo
-- ============================================