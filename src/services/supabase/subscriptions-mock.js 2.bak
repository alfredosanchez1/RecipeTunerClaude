// Mock functions for subscription services

export const getSubscriptionPlans = async () => {
  console.log('🔄 MOCK - Obteniendo planes de suscripción mock');

  // Datos mock de planes de suscripción
  return [
    {
      id: 'premium_mexico_mock',
      name: 'Premium México',
      description: 'Perfecto para cocineros mexicanos con recetas ilimitadas y adaptaciones AI',
      price_monthly: 89,
      price_yearly: 699,
      is_popular: true,
      recipe_limit: -1,
      stripe_price_id: 'price_mock_mx_monthly',
      features: [
        'Recetas ilimitadas',
        'Adaptaciones con IA avanzada',
        'Soporte prioritario 24/7',
        'Sincronización en la nube',
        'Exportación a PDF'
      ]
    },
    {
      id: 'premium_usa_mock',
      name: 'Premium USA',
      description: 'Perfect for international users with advanced AI features',
      price_monthly: 4.99,
      price_yearly: 39.99,
      is_popular: false,
      recipe_limit: -1,
      stripe_price_id: 'price_mock_usa_monthly',
      features: [
        'Unlimited recipes',
        'Advanced AI adaptations',
        'Priority support',
        'Cloud sync',
        'PDF export'
      ]
    }
  ];
};

export const getUserSubscription = async () => {
  console.log('🔄 MOCK - Obteniendo suscripción de usuario mock');
  return null; // Usuario sin suscripción en modo demo
};

export const hasActiveSubscription = async () => {
  console.log('🔄 MOCK - Verificando suscripción activa mock');
  return false; // Sin suscripción activa en modo demo
};

export const getTrialDaysRemaining = async () => {
  console.log('🔄 MOCK - Obteniendo días de trial restantes mock');
  return 7; // 7 días de trial en modo demo
};

export const createSubscription = async (planId, paymentMethodId) => {
  console.log('🔄 MOCK - Creando suscripción mock:', planId);
  throw new Error('Demo: Las suscripciones no están disponibles en modo demo');
};

export const cancelSubscription = async (subscriptionId) => {
  console.log('🔄 MOCK - Cancelando suscripción mock:', subscriptionId);
  throw new Error('Demo: La cancelación no está disponible en modo demo');
};