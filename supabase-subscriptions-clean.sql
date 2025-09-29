CREATE TABLE IF NOT EXISTS recipetuner_subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval_type VARCHAR(20) NOT NULL,
  max_recipes INTEGER DEFAULT -1,
  ai_features BOOLEAN DEFAULT true,
  stripe_price_id VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipetuner_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  auth_user_id UUID,
  app_name VARCHAR(50) DEFAULT 'recipetuner',
  plan_id UUID REFERENCES recipetuner_subscription_plans(id),
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO recipetuner_subscription_plans (name, price, interval_type, max_recipes, ai_features)
VALUES
  ('Plan Gratuito', 0.00, 'month', 3, false),
  ('Plan Trial', 0.00, 'month', 10, true),
  ('Plan Premium', 9.99, 'month', -1, true)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON recipetuner_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_app_name ON recipetuner_subscriptions(app_name);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON recipetuner_subscriptions(status);

ALTER TABLE recipetuner_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipetuner_subscriptions ENABLE ROW LEVEL SECURITY;