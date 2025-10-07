-- Verificar que el nuevo usuario se haya registrado correctamente

-- 1. Ver el último usuario registrado en auth.users
SELECT
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- 2. Ver el último usuario en recipetuner_users
SELECT
    id,
    auth_user_id,
    email,
    name,
    app_name,
    created_at
FROM recipetuner_users
ORDER BY created_at DESC
LIMIT 3;

-- 3. Verificar que el usuario tiene los campos completos
SELECT
    u.id,
    u.auth_user_id,
    u.email,
    u.name,
    u.app_name,
    u.created_at,
    -- Verificar que existe en auth
    CASE WHEN au.id IS NOT NULL THEN '✅ Existe en auth' ELSE '❌ No existe en auth' END as auth_status
FROM recipetuner_users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.app_name = 'recipetuner'
ORDER BY u.created_at DESC
LIMIT 1;
