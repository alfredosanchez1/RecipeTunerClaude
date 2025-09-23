import { supabase, TABLES } from './client';

/**
 * Servicio de gestión de suscripciones para RecipeTuner
 * Integración con Stripe usando credenciales compartidas y metadata
 */

// ===== GESTIÓN DE PLANES =====

/**
 * Obtener todos los planes disponibles
 */
export const getSubscriptionPlans = async () => {
  try {
    console.log('💳 Obteniendo planes de suscripción');

    const { data, error } = await supabase
      .from(TABLES.SUBSCRIPTION_PLANS)
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo planes:', error);
      throw error;
    }

    console.log(`✅ Encontrados ${data.length} planes`);
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo planes:', error);
    throw error;
  }
};

/**
 * Obtener plan por ID
 */
export const getSubscriptionPlan = async (planId) => {
  try {
    console.log('💳 Obteniendo plan:', planId);

    const { data, error } = await supabase
      .from(TABLES.SUBSCRIPTION_PLANS)
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo plan:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo plan:', error);
    throw error;
  }
};

// ===== GESTIÓN DE SUSCRIPCIONES =====

/**
 * Obtener suscripción activa del usuario
 */
export const getUserSubscription = async () => {
  try {
    console.log('🔍 Obteniendo suscripción del usuario');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .select(`
        *,
        plan:${TABLES.SUBSCRIPTION_PLANS}(*)
      `)
      .eq('user_id', (
        await supabase
          .from(TABLES.USERS)
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
      ).data.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error obteniendo suscripción:', error);
      throw error;
    }

    const subscription = data?.[0] || null;
    console.log('✅ Suscripción obtenida:', subscription?.status || 'No encontrada');
    return subscription;
  } catch (error) {
    console.error('❌ Error obteniendo suscripción:', error);
    throw error;
  }
};

/**
 * Crear nueva suscripción
 */
export const createSubscription = async (subscriptionData) => {
  try {
    console.log('💳 Creando suscripción');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener user_id del perfil
    const { data: profile } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) throw new Error('Perfil de usuario no encontrado');

    const subscription = {
      user_id: profile.id,
      plan_id: subscriptionData.planId,
      stripe_subscription_id: subscriptionData.stripeSubscriptionId,
      stripe_customer_id: subscriptionData.stripeCustomerId,
      status: subscriptionData.status,
      current_period_start: subscriptionData.currentPeriodStart,
      current_period_end: subscriptionData.currentPeriodEnd,
      trial_start: subscriptionData.trialStart || null,
      trial_end: subscriptionData.trialEnd || null
    };

    const { data, error } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .insert([subscription])
      .select(`
        *,
        plan:${TABLES.SUBSCRIPTION_PLANS}(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error creando suscripción:', error);
      throw error;
    }

    console.log('✅ Suscripción creada:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error creando suscripción:', error);
    throw error;
  }
};

/**
 * Actualizar suscripción existente
 */
export const updateSubscription = async (subscriptionId, updates) => {
  try {
    console.log('✏️ Actualizando suscripción:', subscriptionId);

    const subscriptionUpdates = {
      status: updates.status,
      current_period_start: updates.currentPeriodStart,
      current_period_end: updates.currentPeriodEnd,
      trial_start: updates.trialStart,
      trial_end: updates.trialEnd,
      canceled_at: updates.canceledAt,
      updated_at: new Date().toISOString()
    };

    // Remover valores undefined
    Object.keys(subscriptionUpdates).forEach(key => {
      if (subscriptionUpdates[key] === undefined) {
        delete subscriptionUpdates[key];
      }
    });

    const { data, error } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .update(subscriptionUpdates)
      .eq('id', subscriptionId)
      .select(`
        *,
        plan:${TABLES.SUBSCRIPTION_PLANS}(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error actualizando suscripción:', error);
      throw error;
    }

    console.log('✅ Suscripción actualizada');
    return data;
  } catch (error) {
    console.error('❌ Error actualizando suscripción:', error);
    throw error;
  }
};

/**
 * Cancelar suscripción
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    console.log('❌ Cancelando suscripción:', subscriptionId);

    const { data, error } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error cancelando suscripción:', error);
      throw error;
    }

    console.log('✅ Suscripción cancelada');
    return data;
  } catch (error) {
    console.error('❌ Error cancelando suscripción:', error);
    throw error;
  }
};

// ===== VERIFICACIÓN DE ESTADO =====

/**
 * Verificar si el usuario tiene suscripción activa
 */
export const hasActiveSubscription = async () => {
  try {
    console.log('🔍 Verificando suscripción activa');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('recipetuner_check_active_subscription', {
        user_uuid: user.id
      });

    if (error) {
      console.error('❌ Error verificando suscripción:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('❌ Error verificando suscripción:', error);
    return false;
  }
};

/**
 * Obtener información completa de la suscripción del usuario
 */
export const getUserSubscriptionInfo = async () => {
  try {
    console.log('📊 Obteniendo información de suscripción');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .rpc('recipetuner_get_user_subscription_info', {
        user_uuid: user.id
      });

    if (error) {
      console.error('❌ Error obteniendo info de suscripción:', error);
      throw error;
    }

    const info = data[0];
    console.log('✅ Información obtenida:', info.plan_name);
    return info;
  } catch (error) {
    console.error('❌ Error obteniendo info de suscripción:', error);
    throw error;
  }
};

/**
 * Verificar si el usuario puede crear más recetas
 */
export const canCreateRecipe = async () => {
  try {
    const info = await getUserSubscriptionInfo();
    return info.can_create_recipe;
  } catch (error) {
    console.error('❌ Error verificando límite de recetas:', error);
    return false;
  }
};

/**
 * Obtener días restantes de trial
 */
export const getTrialDaysRemaining = async () => {
  try {
    const subscription = await getUserSubscription();

    if (!subscription || !subscription.trial_end) {
      return null;
    }

    const now = new Date();
    const trialEnd = new Date(subscription.trial_end);
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  } catch (error) {
    console.error('❌ Error calculando días de trial:', error);
    return null;
  }
};

// ===== BILLING EVENTS =====

/**
 * Registrar evento de facturación
 */
export const createBillingEvent = async (eventData) => {
  try {
    console.log('📝 Registrando evento de facturación:', eventData.eventType);

    const billingEvent = {
      user_id: eventData.userId,
      subscription_id: eventData.subscriptionId,
      stripe_event_id: eventData.stripeEventId,
      event_type: eventData.eventType,
      event_data: eventData.eventData || {},
      processed: false
    };

    const { data, error } = await supabase
      .from(TABLES.BILLING_EVENTS)
      .insert([billingEvent])
      .select()
      .single();

    if (error) {
      console.error('❌ Error registrando evento:', error);
      throw error;
    }

    console.log('✅ Evento registrado:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error registrando evento:', error);
    throw error;
  }
};

/**
 * Marcar evento como procesado
 */
export const markEventAsProcessed = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.BILLING_EVENTS)
      .update({
        processed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error marcando evento:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error marcando evento:', error);
    throw error;
  }
};

// ===== UTILIDADES =====

/**
 * Obtener suscripción por Stripe ID
 */
export const getSubscriptionByStripeId = async (stripeSubscriptionId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .select(`
        *,
        plan:${TABLES.SUBSCRIPTION_PLANS}(*),
        user:${TABLES.USERS}(*)
      `)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo suscripción por Stripe ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo suscripción por Stripe ID:', error);
    throw error;
  }
};

/**
 * Obtener usuario por Stripe Customer ID
 */
export const getUserByStripeCustomerId = async (stripeCustomerId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .select(`
        user:${TABLES.USERS}(*)
      `)
      .eq('stripe_customer_id', stripeCustomerId)
      .limit(1);

    if (error) {
      console.error('❌ Error obteniendo usuario por Customer ID:', error);
      throw error;
    }

    return data[0]?.user || null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario por Customer ID:', error);
    throw error;
  }
};

/**
 * Verificar si un evento ya fue procesado
 */
export const isEventProcessed = async (stripeEventId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.BILLING_EVENTS)
      .select('processed')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error verificando evento:', error);
      throw error;
    }

    return data?.processed || false;
  } catch (error) {
    console.error('❌ Error verificando evento:', error);
    return false;
  }
};

export default {
  getSubscriptionPlans,
  getSubscriptionPlan,
  getUserSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  hasActiveSubscription,
  getUserSubscriptionInfo,
  canCreateRecipe,
  getTrialDaysRemaining,
  createBillingEvent,
  markEventAsProcessed,
  getSubscriptionByStripeId,
  getUserByStripeCustomerId,
  isEventProcessed
};