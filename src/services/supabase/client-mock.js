// Cliente mock de Supabase para evitar errores en Expo Go
console.log('🔄 MOCK - Usando cliente mock de Supabase');

// Mock del cliente Supabase
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({
      data: { user: null, session: null },
      error: { message: 'Mock: Autenticación no disponible en modo demo' }
    }),
    signUp: () => Promise.resolve({
      data: { user: null, session: null },
      error: { message: 'Mock: Registro no disponible en modo demo' }
    }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback) => {
      console.log('🔄 MOCK - Auth state change listener registrado');
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    resetPasswordForEmail: () => Promise.resolve({
      error: { message: 'Mock: Recuperación de contraseña no disponible en modo demo' }
    })
  },
  from: (table) => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'Mock: Base de datos no disponible' } }),
        limit: () => Promise.resolve({ data: [], error: null })
      }),
      limit: () => Promise.resolve({ data: [], error: null })
    }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Mock: Inserción no disponible' } }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: { message: 'Mock: Actualización no disponible' } })
    }),
    upsert: () => Promise.resolve({ data: null, error: { message: 'Mock: Upsert no disponible' } })
  })
};

// Función para verificar la conexión (mock)
export const testSupabaseConnection = async () => {
  console.log('🔗 MOCK - Simulando conexión a Supabase...');
  return {
    success: false,
    error: 'Modo demo - Supabase no conectado'
  };
};

// Constantes para las tablas
export const TABLES = {
  USERS: 'recipetuner_users',
  RECIPES: 'recipetuner_recipes',
  USER_PREFERENCES: 'recipetuner_user_preferences',
  NUTRITION_INFO: 'recipetuner_nutrition_info',
  SHOPPING_LISTS: 'recipetuner_shopping_lists',
  SHOPPING_ITEMS: 'recipetuner_shopping_items',
  SUBSCRIPTION_PLANS: 'recipetuner_subscription_plans',
  SUBSCRIPTIONS: 'recipetuner_subscriptions',
  BILLING_EVENTS: 'recipetuner_billing_events'
};

// Función de utilidad con error handling (mock)
export const withErrorHandling = async (queryFn) => {
  console.log('🔄 MOCK - Ejecutando query mock');
  return null;
};

export default supabase;