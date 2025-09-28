"""
Helper de Integración Supabase para CaloriasAPI
Funciones auxiliares para conectar con Supabase y gestionar datos de suscripciones
"""

import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging
from supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

# ================== VALIDACIÓN DE USUARIOS ==================

async def validate_supabase_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validar token de Supabase y obtener datos del usuario
    """
    try:
        # Verificar token con Supabase
        response = get_supabase_client().auth.get_user(token)

        if response.user:
            # Obtener perfil del usuario desde la tabla
            user_profile = get_supabase_client().table('recipetuner_users').select('*').eq('auth_user_id', response.user.id).execute()

            if user_profile.data:
                return {
                    "user_id": user_profile.data[0]['id'],
                    "auth_user_id": response.user.id,
                    "email": response.user.email,
                    "profile": user_profile.data[0]
                }

        return None

    except Exception as e:
        logger.error(f"❌ Error validando token: {e}")
        return None

# ================== GESTIÓN DE SUSCRIPCIONES ==================

async def create_subscription_in_supabase(subscription_data: Dict[str, Any]) -> bool:
    """
    Crear suscripción en Supabase
    """
    try:
        # Insertar en tabla de suscripciones
        result = get_supabase_client().table('recipetuner_subscriptions').insert({
            'user_id': subscription_data['user_id'],
            'plan_id': subscription_data['plan_id'],
            'stripe_subscription_id': subscription_data['stripe_subscription_id'],
            'stripe_customer_id': subscription_data['stripe_customer_id'],
            'status': subscription_data['status'],
            'current_period_start': subscription_data['current_period_start'],
            'current_period_end': subscription_data['current_period_end'],
            'trial_start': subscription_data.get('trial_start'),
            'trial_end': subscription_data.get('trial_end')
        }).execute()

        logger.info(f"✅ Suscripción creada en Supabase: {result.data[0]['id']}")
        return True

    except Exception as e:
        logger.error(f"❌ Error creando suscripción en Supabase: {e}")
        return False

async def update_subscription_in_supabase(stripe_subscription_id: str, updates: Dict[str, Any]) -> bool:
    """
    Actualizar suscripción en Supabase
    """
    try:
        result = get_supabase_client().table('recipetuner_subscriptions').update(updates).eq('stripe_subscription_id', stripe_subscription_id).execute()

        logger.info(f"✅ Suscripción actualizada en Supabase: {stripe_subscription_id}")
        return True

    except Exception as e:
        logger.error(f"❌ Error actualizando suscripción en Supabase: {e}")
        return False

async def get_subscription_by_stripe_id(stripe_subscription_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtener suscripción por Stripe ID
    """
    try:
        result = get_supabase_client().table('recipetuner_subscriptions').select('*').eq('stripe_subscription_id', stripe_subscription_id).execute()

        if result.data:
            return result.data[0]

        return None

    except Exception as e:
        logger.error(f"❌ Error obteniendo suscripción: {e}")
        return None

# ================== GESTIÓN DE EVENTOS DE FACTURACIÓN ==================

async def create_billing_event(event_data: Dict[str, Any]) -> bool:
    """
    Registrar evento de facturación en Supabase
    """
    try:
        result = get_supabase_client().table('recipetuner_billing_events').insert({
            'user_id': event_data.get('user_id'),
            'subscription_id': event_data.get('subscription_id'),
            'stripe_event_id': event_data['stripe_event_id'],
            'event_type': event_data['event_type'],
            'event_data': event_data['event_data'],
            'processed': False
        }).execute()

        logger.info(f"✅ Evento de facturación registrado: {event_data['stripe_event_id']}")
        return True

    except Exception as e:
        logger.error(f"❌ Error registrando evento: {e}")
        return False

async def is_event_processed(stripe_event_id: str) -> bool:
    """
    Verificar si un evento ya fue procesado
    """
    try:
        result = get_supabase_client().table('recipetuner_billing_events').select('processed').eq('stripe_event_id', stripe_event_id).execute()

        if result.data:
            return result.data[0]['processed']

        return False

    except Exception as e:
        logger.error(f"❌ Error verificando evento: {e}")
        return False

async def mark_event_as_processed(stripe_event_id: str) -> bool:
    """
    Marcar evento como procesado
    """
    try:
        result = get_supabase_client().table('recipetuner_billing_events').update({'processed': True}).eq('stripe_event_id', stripe_event_id).execute()

        logger.info(f"✅ Evento marcado como procesado: {stripe_event_id}")
        return True

    except Exception as e:
        logger.error(f"❌ Error marcando evento: {e}")
        return False

# ================== GESTIÓN DE CUSTOMERS ==================

async def get_or_create_customer_mapping(user_id: str, stripe_customer_id: str) -> bool:
    """
    Crear o actualizar mapeo de customer Stripe con usuario
    """
    try:
        # Verificar si ya existe mapeo
        existing = get_supabase_client().table('recipetuner_stripe_customers').select('*').eq('user_id', user_id).execute()

        if existing.data:
            # Actualizar customer ID existente
            result = get_supabase_client().table('recipetuner_stripe_customers').update({
                'stripe_customer_id': stripe_customer_id
            }).eq('user_id', user_id).execute()
        else:
            # Crear nuevo mapeo
            result = get_supabase_client().table('recipetuner_stripe_customers').insert({
                'user_id': user_id,
                'stripe_customer_id': stripe_customer_id
            }).execute()

        logger.info(f"✅ Mapeo de customer actualizado: {user_id} -> {stripe_customer_id}")
        return True

    except Exception as e:
        logger.error(f"❌ Error gestionando mapeo de customer: {e}")
        return False

async def get_user_by_stripe_customer_id(stripe_customer_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtener usuario por Stripe Customer ID
    """
    try:
        result = get_supabase_client().table('recipetuner_stripe_customers').select('*, user:recipetuner_users(*)').eq('stripe_customer_id', stripe_customer_id).execute()

        if result.data:
            return result.data[0]['user']

        return None

    except Exception as e:
        logger.error(f"❌ Error obteniendo usuario por customer ID: {e}")
        return None

# ================== PLANES DE SUSCRIPCIÓN ==================

async def get_plan_by_id(plan_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtener plan de suscripción por ID
    """
    try:
        result = get_supabase_client().table('recipetuner_subscription_plans').select('*').eq('id', plan_id).execute()

        if result.data:
            return result.data[0]

        return None

    except Exception as e:
        logger.error(f"❌ Error obteniendo plan: {e}")
        return None

# ================== FUNCIONES AUXILIARES ==================

async def get_price_ids_from_plan(plan_id: str) -> Dict[str, str]:
    """
    Obtener Price IDs de Stripe desde la configuración del plan
    """
    try:
        plan = await get_plan_by_id(plan_id)

        if not plan:
            raise Exception(f"Plan no encontrado: {plan_id}")

        return {
            "monthly": plan.get('stripe_price_id_monthly'),
            "yearly": plan.get('stripe_price_id_yearly')
        }

    except Exception as e:
        logger.error(f"❌ Error obteniendo Price IDs: {e}")
        raise

async def log_api_usage(user_id: str, endpoint: str, success: bool, metadata: Dict[str, Any] = None):
    """
    Registrar uso de API para analytics
    """
    try:
        get_supabase_client().table('recipetuner_api_usage').insert({
            'user_id': user_id,
            'endpoint': endpoint,
            'success': success,
            'metadata': metadata or {},
            'timestamp': 'now()'
        }).execute()

    except Exception as e:
        logger.error(f"❌ Error registrando uso de API: {e}")
        # No fallar si el logging falla

# ================== FUNCIONES DE INICIALIZACIÓN ==================

def initialize_stripe_integration():
    """
    Inicializar la integración de Stripe
    """
    logger.info("🍳 RecipeTuner API: Inicializando integración Stripe...")

    # Validar variables de entorno requeridas
    required_vars = ["STRIPE_SECRET_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"❌ Variables de entorno faltantes: {missing_vars}")
        return False

    logger.info("✅ Integración Stripe inicializada correctamente")
    return True

def health_check_enhanced():
    """
    Health check mejorado para RecipeTuner API
    """
    return {
        "status": "healthy",
        "service": "RecipeTuner API",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "integrations": {
            "stripe": bool(os.getenv("STRIPE_SECRET_KEY")),
            "supabase": bool(os.getenv("SUPABASE_URL"))
        }
    }

def validate_required_env_vars(custom_vars=None):
    """
    Validar que todas las variables de entorno requeridas estén presentes
    """
    if custom_vars:
        required_vars = custom_vars
    else:
        required_vars = [
            "STRIPE_SECRET_KEY",
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "PORT"
        ]

    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"❌ Variables de entorno faltantes: {missing_vars}")
        return missing_vars  # Retornar solo la lista de variables faltantes

    logger.info("✅ Todas las variables de entorno requeridas están presentes")
    return []  # Retornar lista vacía si todo está bien