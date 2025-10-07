-- Agregar columnas necesarias si no existen
ALTER TABLE recipetuner_subscriptions
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

ALTER TABLE recipetuner_subscriptions
ADD COLUMN IF NOT EXISTS app_name VARCHAR(50) DEFAULT 'recipetuner';

-- Solo como ejemplo, ya que no hay datos reales aún
-- UPDATE recipetuner_subscriptions SET user_email = 'test@example.com' WHERE user_email IS NULL;