/**
 * Manejo de webhooks de Stripe para RecipeTuner
 * Estos endpoints deberán ser implementados en tu backend
 * Este archivo documenta la lógica que necesitas
 */

import { supabase } from '../supabase/client';
import subscriptionService from '../supabase/subscriptions';

/**
 * Configuración de webhooks para RecipeTuner
 * Agregar estos eventos en tu dashboard de Stripe:
 */
export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated'
};

/**
 * Procesar webhook de suscripción creada
 * Ejemplo de implementación para tu backend
 */
export const handleSubscriptionCreated = async (stripeEvent) => {
  try {
    console.log('🆕 Procesando suscripción creada:', stripeEvent.id);

    const subscription = stripeEvent.data.object;

    // Verificar que es para RecipeTuner
    if (!subscription.metadata?.app_name || subscription.metadata.app_name !== 'recipetuner') {
      console.log('⏭️ Evento no es para RecipeTuner, ignorando');
      return { processed: false, reason: 'not_recipetuner' };
    }

    // Verificar si ya fue procesado
    const isProcessed = await subscriptionService.isEventProcessed(stripeEvent.id);
    if (isProcessed) {
      console.log('⏭️ Evento ya fue procesado');
      return { processed: false, reason: 'already_processed' };
    }

    // Obtener usuario por customer ID
    const user = await subscriptionService.getUserByStripeCustomerId(subscription.customer);
    if (!user) {
      console.error('❌ Usuario no encontrado para customer:', subscription.customer);
      return { processed: false, reason: 'user_not_found' };
    }

    // Obtener plan
    const planId = subscription.metadata.plan_id;
    if (!planId) {
      console.error('❌ Plan ID no encontrado en metadata');
      return { processed: false, reason: 'plan_not_found' };
    }

    // Crear suscripción en Supabase
    const subscriptionData = {
      planId: planId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    };

    const newSubscription = await subscriptionService.createSubscription(subscriptionData);

    // Registrar evento de facturación
    await subscriptionService.createBillingEvent({
      userId: user.id,
      subscriptionId: newSubscription.id,
      stripeEventId: stripeEvent.id,
      eventType: 'subscription.created',
      eventData: subscription
    });

    console.log('✅ Suscripción creada en Supabase:', newSubscription.id);
    return { processed: true, subscriptionId: newSubscription.id };

  } catch (error) {
    console.error('❌ Error procesando suscripción creada:', error);
    throw error;
  }
};

/**
 * Procesar webhook de suscripción actualizada
 */
export const handleSubscriptionUpdated = async (stripeEvent) => {
  try {
    console.log('🔄 Procesando suscripción actualizada:', stripeEvent.id);

    const subscription = stripeEvent.data.object;

    // Verificar que es para RecipeTuner
    if (!subscription.metadata?.app_name || subscription.metadata.app_name !== 'recipetuner') {
      return { processed: false, reason: 'not_recipetuner' };
    }

    // Verificar si ya fue procesado
    const isProcessed = await subscriptionService.isEventProcessed(stripeEvent.id);
    if (isProcessed) {
      return { processed: false, reason: 'already_processed' };
    }

    // Buscar suscripción existente
    const existingSubscription = await subscriptionService.getSubscriptionByStripeId(subscription.id);
    if (!existingSubscription) {
      console.error('❌ Suscripción no encontrada:', subscription.id);
      return { processed: false, reason: 'subscription_not_found' };
    }

    // Actualizar suscripción
    const updates = {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
    };

    const updatedSubscription = await subscriptionService.updateSubscription(
      existingSubscription.id,
      updates
    );

    // Registrar evento
    await subscriptionService.createBillingEvent({
      userId: existingSubscription.user_id,
      subscriptionId: existingSubscription.id,
      stripeEventId: stripeEvent.id,
      eventType: 'subscription.updated',
      eventData: subscription
    });

    console.log('✅ Suscripción actualizada:', updatedSubscription.id);
    return { processed: true, subscriptionId: updatedSubscription.id };

  } catch (error) {
    console.error('❌ Error procesando suscripción actualizada:', error);
    throw error;
  }
};

/**
 * Procesar webhook de suscripción cancelada
 */
export const handleSubscriptionDeleted = async (stripeEvent) => {
  try {
    console.log('❌ Procesando suscripción cancelada:', stripeEvent.id);

    const subscription = stripeEvent.data.object;

    // Verificar que es para RecipeTuner
    if (!subscription.metadata?.app_name || subscription.metadata.app_name !== 'recipetuner') {
      return { processed: false, reason: 'not_recipetuner' };
    }

    // Verificar si ya fue procesado
    const isProcessed = await subscriptionService.isEventProcessed(stripeEvent.id);
    if (isProcessed) {
      return { processed: false, reason: 'already_processed' };
    }

    // Buscar suscripción existente
    const existingSubscription = await subscriptionService.getSubscriptionByStripeId(subscription.id);
    if (!existingSubscription) {
      console.error('❌ Suscripción no encontrada:', subscription.id);
      return { processed: false, reason: 'subscription_not_found' };
    }

    // Cancelar suscripción
    const canceledSubscription = await subscriptionService.cancelSubscription(existingSubscription.id);

    // Registrar evento
    await subscriptionService.createBillingEvent({
      userId: existingSubscription.user_id,
      subscriptionId: existingSubscription.id,
      stripeEventId: stripeEvent.id,
      eventType: 'subscription.deleted',
      eventData: subscription
    });

    console.log('✅ Suscripción cancelada:', canceledSubscription.id);
    return { processed: true, subscriptionId: canceledSubscription.id };

  } catch (error) {
    console.error('❌ Error procesando suscripción cancelada:', error);
    throw error;
  }
};

/**
 * Procesar webhook de pago exitoso
 */
export const handleInvoicePaymentSucceeded = async (stripeEvent) => {
  try {
    console.log('💰 Procesando pago exitoso:', stripeEvent.id);

    const invoice = stripeEvent.data.object;
    const subscriptionId = invoice.subscription;

    // Verificar que la suscripción es para RecipeTuner
    if (!invoice.metadata?.app_name || invoice.metadata.app_name !== 'recipetuner') {
      return { processed: false, reason: 'not_recipetuner' };
    }

    // Verificar si ya fue procesado
    const isProcessed = await subscriptionService.isEventProcessed(stripeEvent.id);
    if (isProcessed) {
      return { processed: false, reason: 'already_processed' };
    }

    // Buscar suscripción
    const subscription = await subscriptionService.getSubscriptionByStripeId(subscriptionId);
    if (!subscription) {
      console.error('❌ Suscripción no encontrada:', subscriptionId);
      return { processed: false, reason: 'subscription_not_found' };
    }

    // Asegurar que la suscripción esté activa
    await subscriptionService.updateSubscription(subscription.id, {
      status: 'active'
    });

    // Registrar evento de pago
    await subscriptionService.createBillingEvent({
      userId: subscription.user_id,
      subscriptionId: subscription.id,
      stripeEventId: stripeEvent.id,
      eventType: 'invoice.payment_succeeded',
      eventData: invoice
    });

    console.log('✅ Pago procesado exitosamente');
    return { processed: true, subscriptionId: subscription.id };

  } catch (error) {
    console.error('❌ Error procesando pago exitoso:', error);
    throw error;
  }
};

/**
 * Procesar webhook de pago fallido
 */
export const handleInvoicePaymentFailed = async (stripeEvent) => {
  try {
    console.log('❌ Procesando pago fallido:', stripeEvent.id);

    const invoice = stripeEvent.data.object;
    const subscriptionId = invoice.subscription;

    // Verificar que la suscripción es para RecipeTuner
    if (!invoice.metadata?.app_name || invoice.metadata.app_name !== 'recipetuner') {
      return { processed: false, reason: 'not_recipetuner' };
    }

    // Verificar si ya fue procesado
    const isProcessed = await subscriptionService.isEventProcessed(stripeEvent.id);
    if (isProcessed) {
      return { processed: false, reason: 'already_processed' };
    }

    // Buscar suscripción
    const subscription = await subscriptionService.getSubscriptionByStripeId(subscriptionId);
    if (!subscription) {
      console.error('❌ Suscripción no encontrada:', subscriptionId);
      return { processed: false, reason: 'subscription_not_found' };
    }

    // Actualizar estado de suscripción
    await subscriptionService.updateSubscription(subscription.id, {
      status: 'past_due'
    });

    // Registrar evento de pago fallido
    await subscriptionService.createBillingEvent({
      userId: subscription.user_id,
      subscriptionId: subscription.id,
      stripeEventId: stripeEvent.id,
      eventType: 'invoice.payment_failed',
      eventData: invoice
    });

    console.log('✅ Pago fallido procesado');
    return { processed: true, subscriptionId: subscription.id };

  } catch (error) {
    console.error('❌ Error procesando pago fallido:', error);
    throw error;
  }
};

/**
 * Router principal de webhooks
 * Implementar en tu backend
 */
export const handleWebhook = async (stripeEvent) => {
  try {
    console.log('📥 Procesando webhook:', stripeEvent.type);

    let result;

    switch (stripeEvent.type) {
      case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
        result = await handleSubscriptionCreated(stripeEvent);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        result = await handleSubscriptionUpdated(stripeEvent);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        result = await handleSubscriptionDeleted(stripeEvent);
        break;

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
        result = await handleInvoicePaymentSucceeded(stripeEvent);
        break;

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        result = await handleInvoicePaymentFailed(stripeEvent);
        break;

      default:
        console.log('⏭️ Evento no manejado:', stripeEvent.type);
        result = { processed: false, reason: 'event_not_handled' };
    }

    // Marcar evento como procesado si fue exitoso
    if (result.processed) {
      const billingEvent = await subscriptionService.createBillingEvent({
        stripeEventId: stripeEvent.id,
        eventType: stripeEvent.type,
        eventData: stripeEvent.data.object,
        processed: true
      });
      await subscriptionService.markEventAsProcessed(billingEvent.id);
    }

    return result;

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    throw error;
  }
};

/**
 * Configuración de endpoints para tu backend
 * Ejemplo de estructura de rutas
 */
export const WEBHOOK_ENDPOINTS = {
  // Endpoint principal para todos los webhooks de Stripe
  main: '/api/stripe/webhooks',

  // Endpoints específicos (opcional)
  subscription: '/api/stripe/webhooks/subscription',
  payment: '/api/stripe/webhooks/payment',
  customer: '/api/stripe/webhooks/customer'
};

/**
 * Configuración de URL de webhook en Stripe
 * Agregar en tu dashboard de Stripe con estos eventos:
 */
export const STRIPE_WEBHOOK_CONFIG = {
  url: 'https://recipetuner-api.onrender.com/api/stripe/webhooks',
  events: [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.created',
    'customer.updated'
  ],
  metadata: {
    app_name: 'recipetuner',
    version: '1.0.0'
  }
};

export default {
  handleWebhook,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  WEBHOOK_EVENTS,
  WEBHOOK_ENDPOINTS,
  STRIPE_WEBHOOK_CONFIG
};