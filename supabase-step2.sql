CREATE TABLE recipetuner_subscriptions (
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