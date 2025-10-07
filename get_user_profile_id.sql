-- Obtener el ID del perfil del usuario en recipetuner_users
-- Auth User ID: b4731e7b-928c-4b99-8ba5-43fea7d69e13

SELECT
    id as profile_id,
    auth_user_id,
    email,
    name,
    app_name
FROM recipetuner_users
WHERE auth_user_id = 'b4731e7b-928c-4b99-8ba5-43fea7d69e13'
AND app_name = 'recipetuner';
