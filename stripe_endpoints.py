"""
Endpoints Stripe para CaloriasAPI - Implementación FastAPI
Endpoints faltantes para integración completa con RecipeTuner
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import stripe
import os
import json
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurar Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Router para endpoints Stripe
router = APIRouter()

# ================== MODELOS PYDANTIC ==================

class CreateSubscriptionRequest(BaseModel):
    planId: str
    isYearly: bool = False
    paymentMethodId: str
    metadata: Dict[str, str] = {}

class CancelSubscriptionRequest(BaseModel):
    subscriptionId: str
    metadata: Dict[str, str] = {}

class UpdatePaymentMethodRequest(BaseModel):
    subscriptionId: str
    paymentMethodId: str
    metadata: Dict[str, str] = {}

# ================== VALIDACIONES ==================

def validate_recipetuner_request(metadata: Dict[str, str]):
    """Validar que la request es de RecipeTuner"""
    if metadata.get("app_name") != "recipetuner":
        raise HTTPException(
            status_code=400,
            detail="Invalid app_name. Expected 'recipetuner'"
        )

async def get_current_user(request: Request):
    """Obtener usuario actual desde el token de autorización"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autorización requerido")

    # Aquí validarías el token con Supabase
    token = auth_header.replace("Bearer ", "")
    # TODO: Implementar validación con Supabase
    return {"user_id": "user_from_token", "email": "user@example.com"}

# ================== ENDPOINTS ==================

@router.post("/create-subscription")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user = Depends(get_current_user)
):
    """
    Crear nueva suscripción en Stripe
    """
    try:
        logger.info(f"📝 Creando suscripción para usuario: {current_user.get('user_id')}")

        # Validar que es request de RecipeTuner
        validate_recipetuner_request(request.metadata)

        # Buscar o crear customer en Stripe
        customer = await get_or_create_stripe_customer(current_user)

        # Obtener price_id basado en planId e isYearly
        price_id = await get_price_id(request.planId, request.isYearly)

        # Adjuntar método de pago al customer
        await stripe.PaymentMethod.attach(
            request.paymentMethodId,
            customer=customer.id
        )

        # Crear suscripción
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": price_id}],
            default_payment_method=request.paymentMethodId,
            trial_period_days=7,  # 7 días de trial
            metadata={
                **request.metadata,
                "user_id": current_user.get("user_id"),
                "created_at": datetime.utcnow().isoformat()
            }
        )

        logger.info(f"✅ Suscripción creada: {subscription.id}")

        return {
            "success": True,
            "subscription_id": subscription.id,
            "client_secret": subscription.latest_invoice.payment_intent.client_secret if subscription.latest_invoice else None,
            "status": subscription.status,
            "current_period_end": subscription.current_period_end,
            "trial_end": subscription.trial_end
        }

    except stripe.error.CardError as e:
        logger.error(f"❌ Error de tarjeta: {e}")
        raise HTTPException(status_code=400, detail=f"Error de tarjeta: {e.user_message}")

    except stripe.error.StripeError as e:
        logger.error(f"❌ Error de Stripe: {e}")
        raise HTTPException(status_code=500, detail=f"Error de Stripe: {str(e)}")

    except Exception as e:
        logger.error(f"❌ Error inesperado: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/cancel-subscription")
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    current_user = Depends(get_current_user)
):
    """
    Cancelar suscripción existente
    """
    try:
        logger.info(f"❌ Cancelando suscripción: {request.subscriptionId}")

        # Validar que es request de RecipeTuner
        validate_recipetuner_request(request.metadata)

        # Verificar que la suscripción pertenece al usuario
        subscription = stripe.Subscription.retrieve(request.subscriptionId)
        if not subscription:
            raise HTTPException(status_code=404, detail="Suscripción no encontrada")

        # Cancelar suscripción (al final del período actual)
        canceled_subscription = stripe.Subscription.modify(
            request.subscriptionId,
            cancel_at_period_end=True,
            metadata={
                **request.metadata,
                "canceled_by": current_user.get("user_id"),
                "canceled_at": datetime.utcnow().isoformat()
            }
        )

        logger.info(f"✅ Suscripción cancelada: {canceled_subscription.id}")

        return {
            "success": True,
            "subscription_id": canceled_subscription.id,
            "status": canceled_subscription.status,
            "cancel_at_period_end": canceled_subscription.cancel_at_period_end,
            "current_period_end": canceled_subscription.current_period_end
        }

    except stripe.error.StripeError as e:
        logger.error(f"❌ Error de Stripe: {e}")
        raise HTTPException(status_code=500, detail=f"Error de Stripe: {str(e)}")

    except Exception as e:
        logger.error(f"❌ Error inesperado: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/update-payment-method")
async def update_payment_method(
    request: UpdatePaymentMethodRequest,
    current_user = Depends(get_current_user)
):
    """
    Actualizar método de pago de una suscripción
    """
    try:
        logger.info(f"💳 Actualizando método de pago: {request.subscriptionId}")

        # Validar que es request de RecipeTuner
        validate_recipetuner_request(request.metadata)

        # Obtener suscripción
        subscription = stripe.Subscription.retrieve(request.subscriptionId)
        if not subscription:
            raise HTTPException(status_code=404, detail="Suscripción no encontrada")

        # Adjuntar nuevo método de pago al customer
        await stripe.PaymentMethod.attach(
            request.paymentMethodId,
            customer=subscription.customer
        )

        # Actualizar método de pago por defecto
        stripe.Subscription.modify(
            request.subscriptionId,
            default_payment_method=request.paymentMethodId,
            metadata={
                **request.metadata,
                "payment_method_updated_by": current_user.get("user_id"),
                "updated_at": datetime.utcnow().isoformat()
            }
        )

        logger.info(f"✅ Método de pago actualizado: {request.subscriptionId}")

        return {
            "success": True,
            "subscription_id": subscription.id,
            "payment_method_id": request.paymentMethodId,
            "status": subscription.status
        }

    except stripe.error.StripeError as e:
        logger.error(f"❌ Error de Stripe: {e}")
        raise HTTPException(status_code=500, detail=f"Error de Stripe: {str(e)}")

    except Exception as e:
        logger.error(f"❌ Error inesperado: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/stripe/webhooks")
async def stripe_webhooks(request: Request):
    """
    Manejar webhooks de Stripe
    """
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

        if not endpoint_secret:
            raise HTTPException(status_code=500, detail="Webhook secret no configurado")

        # Verificar webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Payload inválido")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Signature inválida")

        logger.info(f"📥 Webhook recibido: {event['type']}")

        # Procesar eventos específicos de RecipeTuner
        if event['type'] == 'customer.subscription.created':
            await handle_subscription_created(event)
        elif event['type'] == 'customer.subscription.updated':
            await handle_subscription_updated(event)
        elif event['type'] == 'customer.subscription.deleted':
            await handle_subscription_deleted(event)
        elif event['type'] == 'invoice.payment_succeeded':
            await handle_payment_succeeded(event)
        elif event['type'] == 'invoice.payment_failed':
            await handle_payment_failed(event)
        else:
            logger.info(f"⏭️ Evento no manejado: {event['type']}")

        return {"success": True}

    except Exception as e:
        logger.error(f"❌ Error procesando webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Error procesando webhook: {str(e)}")


# ================== FUNCIONES AUXILIARES ==================

async def get_or_create_stripe_customer(user_data: Dict[str, Any]):
    """Buscar o crear customer en Stripe"""
    try:
        # Buscar customer existente por metadata
        customers = stripe.Customer.list(
            email=user_data.get("email"),
            limit=1
        )

        if customers.data:
            return customers.data[0]

        # Crear nuevo customer
        customer = stripe.Customer.create(
            email=user_data.get("email"),
            metadata={
                "app_name": "recipetuner",
                "user_id": user_data.get("user_id")
            }
        )

        return customer

    except Exception as e:
        logger.error(f"❌ Error gestionando customer: {e}")
        raise

async def get_price_id(plan_id: str, is_yearly: bool):
    """Obtener price_id de Stripe basado en plan y frecuencia"""
    # Mapeo de planes (actualizar con tus price_ids reales)
    PRICE_MAPPING = {
        "premium_mexico": {
            "monthly": "price_mexico_monthly_89mxn",
            "yearly": "price_mexico_yearly_699mxn"
        },
        "premium_usa": {
            "monthly": "price_usa_monthly_499usd",
            "yearly": "price_usa_yearly_3999usd"
        }
    }

    frequency = "yearly" if is_yearly else "monthly"

    if plan_id not in PRICE_MAPPING:
        raise HTTPException(status_code=400, detail=f"Plan no válido: {plan_id}")

    price_id = PRICE_MAPPING[plan_id][frequency]

    if not price_id:
        raise HTTPException(status_code=400, detail=f"Price ID no encontrado para {plan_id} {frequency}")

    return price_id

# ================== HANDLERS DE WEBHOOKS ==================

async def handle_subscription_created(event):
    """Manejar suscripción creada"""
    subscription = event['data']['object']

    # Solo procesar eventos de RecipeTuner
    if subscription.get('metadata', {}).get('app_name') != 'recipetuner':
        return

    logger.info(f"🆕 Suscripción creada: {subscription['id']}")

    # TODO: Actualizar base de datos (Supabase)
    # await update_subscription_in_supabase(subscription)

async def handle_subscription_updated(event):
    """Manejar suscripción actualizada"""
    subscription = event['data']['object']

    if subscription.get('metadata', {}).get('app_name') != 'recipetuner':
        return

    logger.info(f"🔄 Suscripción actualizada: {subscription['id']}")

    # TODO: Actualizar base de datos (Supabase)

async def handle_subscription_deleted(event):
    """Manejar suscripción cancelada"""
    subscription = event['data']['object']

    if subscription.get('metadata', {}).get('app_name') != 'recipetuner':
        return

    logger.info(f"❌ Suscripción cancelada: {subscription['id']}")

    # TODO: Actualizar base de datos (Supabase)

async def handle_payment_succeeded(event):
    """Manejar pago exitoso"""
    invoice = event['data']['object']

    if invoice.get('metadata', {}).get('app_name') != 'recipetuner':
        return

    logger.info(f"💰 Pago exitoso: {invoice['id']}")

    # TODO: Registrar pago en base de datos

async def handle_payment_failed(event):
    """Manejar pago fallido"""
    invoice = event['data']['object']

    if invoice.get('metadata', {}).get('app_name') != 'recipetuner':
        return

    logger.info(f"❌ Pago fallido: {invoice['id']}")

    # TODO: Notificar al usuario y actualizar estado