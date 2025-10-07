ALTER TABLE recipetuner_subscriptions
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS app_name VARCHAR(50) DEFAULT 'recipetuner';

UPDATE recipetuner_subscriptions
SET user_email = (SELECT email FROM auth.users WHERE id = auth_user_id)
WHERE user_email IS NULL;