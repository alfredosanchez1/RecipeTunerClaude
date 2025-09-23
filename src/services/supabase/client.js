import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase para RecipeTuner
const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

// Cliente Supabase configurado para RecipeTuner
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => {
        try {
          const value = localStorage.getItem(key);
          return Promise.resolve(value);
        } catch {
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      }
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-App-Name': 'recipetuner'
    }
  }
});

// Función para verificar la conexión
export const testSupabaseConnection = async () => {
  try {
    console.log('🔗 Testing Supabase connection...');

    // Test simple query
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return { success: false, error: error.message };
  }
};

// Constantes para las tablas de RecipeTuner
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

// Funciones de utilidad para queries
export const withErrorHandling = async (queryFn) => {
  try {
    const result = await queryFn();

    if (result.error) {
      console.error('❌ Supabase query error:', result.error);
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error('❌ Query execution error:', error);
    throw error;
  }
};

export default supabase;