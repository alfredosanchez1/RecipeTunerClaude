-- Crear tablas de suscripción para RecipeTuner
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS recipetuner_subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval_type VARCHAR(20) NOT NULL, -- 'month', 'year'
  max_recipes INTEGER DEFAULT -1, -- -1 = unlimited
  ai_features BOOLEAN DEFAULT true,
  stripe_price_id VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de suscripciones de usuarios
CREATE TABLE IF NOT EXISTS recipetuner_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  auth_user_id UUID,
  app_name VARCHAR(50) DEFAULT 'recipetuner',
  plan_id UUID REFERENCES recipetuner_subscription_plans(id),
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- 'trial', 'active', 'past_due', 'canceled', 'unpaid'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insertar plan básico de prueba
INSERT INTO recipetuner_subscription_plans (name, price, interval_type, max_recipes, ai_features)
VALUES
  ('Plan Gratuito', 0.00, 'month', 3, false),
  ('Plan Trial', 0.00, 'month', 10, true),
  ('Plan Premium', 9.99, 'month', -1, true)
ON CONFLICT DO NOTHING;

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON recipetuner_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_app_name ON recipetuner_subscriptions(app_name);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON recipetuner_subscriptions(status);

-- 5. RLS (Row Level Security)
ALTER TABLE recipetuner_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipetuner_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para planes (público para lectura)
CREATE POLICY "Plans are viewable by everyone" ON recipetuner_subscription_plans
    FOR SELECT USING (active = true);

-- Política para suscripciones (solo el usuario puede ver sus propias suscripciones)
CREATE POLICY "Users can view own subscriptions" ON recipetuner_subscriptions
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own subscriptions" ON recipetuner_subscriptions
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own subscriptions" ON recipetuner_subscriptions
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);