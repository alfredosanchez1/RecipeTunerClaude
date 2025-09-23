/**
 * Configuración del Backend - RecipeTuner API
 * Servidor independiente para RecipeTuner (separado de CalorieSnap)
 */

// URL base del servidor en Render
export const BACKEND_CONFIG = {
  BASE_URL: 'https://recipetuner-api.onrender.com',
  TIMEOUT: 30000, // 30 segundos

  // Endpoints de Stripe (verificados con CaloriasAPI)
  STRIPE_ENDPOINTS: {
    CREATE_PAYMENT_INTENT: '/create-payment-intent', // ✅ Disponible
    TEST_PAYMENT_INTENT: '/test-payment-intent',
    // Los siguientes endpoints necesitan ser implementados en el servidor:
    CREATE_SUBSCRIPTION: '/create-subscription', // ❌ 404 - Necesita implementación
    CANCEL_SUBSCRIPTION: '/cancel-subscription', // ❌ 404 - Necesita implementación
    UPDATE_PAYMENT_METHOD: '/update-payment-method', // ❌ 404 - Necesita implementación
    WEBHOOKS: '/stripe/webhooks' // Pendiente de verificar
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