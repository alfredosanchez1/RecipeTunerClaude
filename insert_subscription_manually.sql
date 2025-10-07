-- Insertar manualmente la suscripción en Supabase
-- Suscripción: sub_1SDAYTRZPUbUqU0XTDSeJehx
-- Usuario: Alfredo Sánchez (wiseailabs@gmail.com)
-- Profile ID: 427c07bf-b800-4750-a92b-20e01ec1e99c

INSERT INTO recipetuner_subscriptions (
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    status,
    current_period_start,
    current_period_end,
    trial_start,
    trial_end,
    app_name
) VALUES (
    '427c07bf-b800-4750-a92b-20e01ec1e99c',  -- profile_id correcto
    'sub_1SDAYTRZPUbUqU0XTDSeJehx',           -- stripe_subscription_id
    'cus_T9TV8pgu6XQrC5',                     -- stripe_customer_id
    'trialing',                                -- status
    NULL,                                      -- current_period_start (no disponible en trial)
    NULL,                                      -- current_period_end (no disponible en trial)
    '2025-09-30 20:53:49+00',                 -- trial_start
    '2025-10-07 20:53:49+00',                 -- trial_end (7 días después)
    'recipetuner'                              -- app_name
)
ON CONFLICT (stripe_subscription_id)
DO UPDATE SET
    user_id = EXCLUDED.user_id,
    status = EXCLUDED.status,
    trial_start = EXCLUDED.trial_start,
    trial_end = EXCLUDED.trial_end,
    app_name = EXCLUDED.app_name;

-- Verificar que se insertó correctamente
SELECT
    s.id,
    s.stripe_subscription_id,
    s.stripe_customer_id,
    s.status,
    s.trial_end,
    s.app_name,
    u.email,
    u.name
FROM recipetuner_subscriptions s
JOIN recipetuner_users u ON s.user_id = u.id
WHERE s.stripe_subscription_id = 'sub_1SDAYTRZPUbUqU0XTDSeJehx';
