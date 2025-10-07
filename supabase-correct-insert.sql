INSERT INTO recipetuner_subscription_plans (name, description, price_monthly, price_yearly, max_recipes, trial_days, features, is_active)
VALUES
  ('Plan Gratuito', 'Plan básico gratuito con funciones limitadas', 0.00, 0.00, 3, 0, '{"ai_features": false}', true),
  ('Plan Trial', 'Período de prueba de 7 días con acceso completo', 0.00, 0.00, 10, 7, '{"ai_features": true}', true),
  ('Plan Premium', 'Plan premium con acceso completo a todas las funciones', 9.99, 99.99, -1, 7, '{"ai_features": true}', true);