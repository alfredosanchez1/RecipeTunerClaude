-- Verificar planes de suscripción en Supabase
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
    features,
    is_active,
    created_at
FROM recipetuner_subscription_plans
ORDER BY price_monthly NULLS FIRST;
