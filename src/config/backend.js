/**
 * Configuración del Backend - RecipeTuner API
 * Servidor independiente para RecipeTuner (separado de CalorieSnap)
 */

// URL base del servidor en Render
export const BACKEND_CONFIG = {
  BASE_URL: 'https://recipetunerclaude.onrender.com',
  TIMEOUT: 30000, // 30 segundos

  // Endpoints de Stripe (con prefijo /api según main.py línea 117)
  STRIPE_ENDPOINTS: {
    CREATE_PAYMENT_INTENT: '/api/create-payment-intent', // ✅ Corregido con prefijo /api
    CREATE_PAYMENT_INTENT_TEST: '/api/test-create-payment-intent-no-auth', // 🧪 Test endpoint sin auth
    SIMPLE_TEST: '/api/simple-test', // 🧪 Endpoint simple para verificar despliegue
    CREATE_SUBSCRIPTION: '/api/create-subscription', // ✅ Corregido con prefijo /api
    CANCEL_SUBSCRIPTION: '/api/cancel-subscription', // ✅ Corregido con prefijo /api
    UPDATE_PAYMENT_METHOD: '/api/update-payment-method', // ✅ Corregido con prefijo /api
    WEBHOOKS: '/api/stripe/webhooks' // ✅ Corregido con prefijo /api
  },

  // Endpoints de análisis de imágenes (heredados de CaloriasFotoAPP)
  IMAGE_ENDPOINTS: {
    UPLOAD_IMAGE: '/upload',
    ANALYZE_URL: '/analyze-url'
  },

  // Endpoint de salud
  HEALTH_ENDPOINT: '/health'
};

/**
 * Construir URL completa para un endpoint
 */
export const buildApiUrl = (endpoint) => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Configuración de headers por defecto
 */
export const getDefaultHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

/**
 * Configuración de headers con autorización
 */
export const getAuthHeaders = async () => {
  try {
    const { supabase } = await import('../services/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();

    return {
      ...getDefaultHeaders(),
      'Authorization': `Bearer ${session?.access_token}`
    };
  } catch (error) {
    console.error('❌ Error obteniendo headers de auth:', error);
    return getDefaultHeaders();
  }
};

/**
 * Verificar estado del servidor
 */
export const checkServerHealth = async () => {
  try {
    const response = await fetch(buildApiUrl(BACKEND_CONFIG.HEALTH_ENDPOINT), {
      method: 'GET',
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Servidor saludable:', data);
    return { healthy: true, data };
  } catch (error) {
    console.error('❌ Error verificando servidor:', error);
    return { healthy: false, error: error.message };
  }
};

/**
 * Función helper para hacer requests al backend
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = buildApiUrl(endpoint);
    const headers = options.auth ? await getAuthHeaders() : getDefaultHeaders();

    const config = {
      method: 'GET',
      headers,
      timeout: BACKEND_CONFIG.TIMEOUT,
      ...options
    };

    console.log(`🌐 API Request: ${config.method} ${url}`);

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', data);
    return data;
  } catch (error) {
    console.error('❌ API Request failed:', error);
    throw error;
  }
};

export default {
  BACKEND_CONFIG,
  buildApiUrl,
  getDefaultHeaders,
  getAuthHeaders,
  checkServerHealth,
  apiRequest
};