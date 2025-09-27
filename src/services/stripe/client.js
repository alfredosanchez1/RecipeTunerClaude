import React, { createContext, useContext, useState } from 'react';
import { BACKEND_CONFIG, buildApiUrl, getAuthHeaders } from '../../config/backend';

/**
 * Cliente Stripe para RecipeTuner
 * Usa credenciales compartidas con metadata para diferenciar la app
 * Conectado a RecipeTuner API independiente: https://recipetuner-api.onrender.com
 */

// Configuración de Stripe para RecipeTuner
const STRIPE_CONFIG = {
  // Stripe publishable key real para RecipeTuner
  publishableKey: 'pk_live_51RnpLnRbKyoDfUk2NgluRiZWu29rBZ0q71bs6l93fHpJ0TWnDrxb61wKd5aEHtggcM339cU7NEgPHNNpAC1jTDGb00wiWF9jTK',
  merchantIdentifier: 'com.recipetuner.app', // Para Apple Pay
  urlScheme: 'recipetuner', // Para deep linking
  // Metadata para identificar que es RecipeTuner
  metadata: {
    app_name: 'recipetuner',
    app_version: '1.0.0'
  }
};

// Context para manejar Stripe de forma simple
const StripeContext = createContext();

/**
 * Provider simple de Stripe para Expo
 */
export const RecipeTunerStripeProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(true);

  const stripeValue = {
    isReady,
    publishableKey: STRIPE_CONFIG.publishableKey,
    config: STRIPE_CONFIG
  };

  return (
    <StripeContext.Provider value={stripeValue}>
      {children}
    </StripeContext.Provider>
  );
};

/**
 * Hook simple para usar Stripe en Expo
 */
export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe debe usarse dentro de RecipeTunerStripeProvider');
  }
  return context;
};

// ===== FUNCIONES DE PAGOS =====

/**
 * Crear Payment Intent para suscripción
 */
export const createPaymentIntent = async (planId, isYearly = false) => {
  try {
    console.log('💳 Creando Payment Intent para plan:', planId);

    // Llamar a CaloriasAPI en Render para crear el Payment Intent
    const response = await fetch(buildApiUrl(BACKEND_CONFIG.STRIPE_ENDPOINTS.CREATE_PAYMENT_INTENT), {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        planId,
        isYearly,
        metadata: {
          app_name: 'recipetuner',
          plan_id: planId,
          billing_cycle: isYearly ? 'yearly' : 'monthly'
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error creating payment intent');
    }

    const data = await response.json();
    console.log('✅ Payment Intent creado:', data.client_secret);
    return data;
  } catch (error) {
    console.error('❌ Error creando Payment Intent:', error);
    throw error;
  }
};

/**
 * Crear suscripción con Stripe
 */
export const createStripeSubscription = async (planId, isYearly = false, paymentMethodId) => {
  try {
    console.log('📝 Creando suscripción Stripe:', planId);

    const response = await fetch(buildApiUrl(BACKEND_CONFIG.STRIPE_ENDPOINTS.CREATE_SUBSCRIPTION), {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        planId,
        isYearly,
        paymentMethodId,
        metadata: {
          app_name: 'recipetuner',
          plan_id: planId,
          billing_cycle: isYearly ? 'yearly' : 'monthly',
          user_source: 'mobile_app'
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error creating subscription');
    }

    const data = await response.json();
    console.log('✅ Suscripción creada:', data.subscription_id);
    return data;
  } catch (error) {
    console.error('❌ Error creando suscripción:', error);
    throw error;
  }
};

/**
 * Cancelar suscripción
 */
export const cancelStripeSubscription = async (subscriptionId) => {
  try {
    console.log('❌ Cancelando suscripción:', subscriptionId);

    const response = await fetch(buildApiUrl(BACKEND_CONFIG.STRIPE_ENDPOINTS.CANCEL_SUBSCRIPTION), {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        subscriptionId,
        metadata: {
          app_name: 'recipetuner',
          cancellation_reason: 'user_requested'
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error canceling subscription');
    }

    const data = await response.json();
    console.log('✅ Suscripción cancelada');
    return data;
  } catch (error) {
    console.error('❌ Error cancelando suscripción:', error);
    throw error;
  }
};

/**
 * Actualizar método de pago
 */
export const updatePaymentMethod = async (subscriptionId, paymentMethodId) => {
  try {
    console.log('💳 Actualizando método de pago:', subscriptionId);

    const response = await fetch(buildApiUrl(BACKEND_CONFIG.STRIPE_ENDPOINTS.UPDATE_PAYMENT_METHOD), {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        subscriptionId,
        paymentMethodId,
        metadata: {
          app_name: 'recipetuner'
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error updating payment method');
    }

    const data = await response.json();
    console.log('✅ Método de pago actualizado');
    return data;
  } catch (error) {
    console.error('❌ Error actualizando método de pago:', error);
    throw error;
  }
};

// ===== HOOKS DE REACT NATIVE =====

/**
 * Hook simplificado para Expo (sin SDK nativo)
 */
export const useRecipeTunerStripe = () => {
  const stripe = useStripe();

  const processPayment = async (planId, isYearly = false) => {
    try {
      console.log('💳 Procesando pago para plan:', planId);

      // Por ahora, solo crear el payment intent
      // La confirmación se manejará cuando tengamos el servidor funcionando
      const response = await createPaymentIntent(planId, isYearly);

      console.log('✅ Payment Intent creado:', response);
      return response;
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      throw error;
    }
  };

  const createPaymentMethod = async (cardDetails) => {
    // Placeholder para futuras implementaciones
    console.log('💳 Crear método de pago (placeholder):', cardDetails);
    return { id: 'pm_placeholder', type: 'card' };
  };

  return {
    stripe,
    processPayment,
    createPaymentMethod,
    isReady: stripe?.isReady || false
  };
};

// ===== UTILIDADES =====

/**
 * Obtener token de usuario actual de Supabase
 */
const getCurrentUserToken = async () => {
  try {
    const { supabase } = await import('../supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error);
    return null;
  }
};

/**
 * Formatear precio para mostrar
 */
export const formatPrice = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount / 100); // Stripe usa centavos
};

/**
 * Calcular descuento anual
 */
export const calculateYearlyDiscount = (monthlyPrice, yearlyPrice) => {
  const annualMonthly = monthlyPrice * 12;
  const savings = annualMonthly - yearlyPrice;
  const percentage = Math.round((savings / annualMonthly) * 100);
  return {
    savings,
    percentage,
    formattedSavings: formatPrice(savings)
  };
};

/**
 * Validar datos de tarjeta
 */
export const validateCardData = (cardData) => {
  const errors = {};

  if (!cardData.number || cardData.number.length < 13) {
    errors.number = 'Número de tarjeta inválido';
  }

  if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
    errors.expiry = 'Fecha de expiración inválida (MM/AA)';
  }

  if (!cardData.cvc || cardData.cvc.length < 3) {
    errors.cvc = 'CVC inválido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  RecipeTunerStripeProvider,
  createPaymentIntent,
  createStripeSubscription,
  cancelStripeSubscription,
  updatePaymentMethod,
  useRecipeTunerStripe,
  formatPrice,
  calculateYearlyDiscount,
  validateCardData,
  STRIPE_CONFIG
};