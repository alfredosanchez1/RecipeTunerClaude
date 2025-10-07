-- Verificar la suscripción del usuario nuevo (Alfredo Sánchez / wiseailabs@gmail.com)

-- 1. Ver información del usuario
SELECT
    id,
    auth_user_id,
    email,
    name,
    app_name,
    created_at
FROM recipetuner_users
WHERE email = 'wiseailabs@gmail.com';

-- 2. Ver suscripciones del usuario
SELECT
    id,
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    status,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end,
    app_name,
    created_at
FROM recipetuner_subscriptions
WHERE user_id = (
    SELECT id FROM recipetuner_users WHERE email = 'wiseailabs@gmail.com'
)
ORDER BY created_at DESC;

-- 3. Verificar que app_name es correcto
SELECT
    s.stripe_subscription_id,
    s.status,
    s.app_name,
    u.email,
    u.app_name as user_app_name,
    CASE
        WHEN s.app_name = u.app_name THEN '✅ App names coinciden'
        ELSE '❌ App names NO coinciden'
    END as validacion
FROM recipetuner_subscriptions s
JOIN recipetuner_users u ON s.user_id = u.id
WHERE u.email = 'wiseailabs@gmail.com';

-- 4. Ver todas las suscripciones activas/en trial
SELECT
    s.id,
    u.email,
    s.stripe_subscription_id,
    s.status,
    s.trial_end,
    s.app_name
FROM recipetuner_subscriptions s
JOIN recipetuner_users u ON s.user_id = u.id
WHERE s.status IN ('active', 'trialing')
AND s.app_name = 'recipetuner'
ORDER BY s.created_at DESC;
