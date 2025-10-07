INSERT INTO recipetuner_subscription_plans (name, price, interval_type, max_recipes, ai_features)
VALUES
  ('Plan Gratuito', 0.00, 'month', 3, false),
  ('Plan Trial', 0.00, 'month', 10, true),
  ('Plan Premium', 9.99, 'month', -1, true);