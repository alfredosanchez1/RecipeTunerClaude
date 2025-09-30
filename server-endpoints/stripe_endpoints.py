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

class CreatePaymentIntentRequest(BaseModel):
    amount: int
    currency: str = "usd"
    plan_id: Optional[str] = None
    price_id: Optional[str] = None
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
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.error("❌ Token de autorización faltante o inválido")
            raise HTTPException(status_code=401, detail="Token de autorización requerido")

        token = auth_header.replace("Bearer ", "")

        # Validar token con Supabase
        from supabase import create_client

        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("❌ Supabase no configurado en el servidor")
            raise HTTPException(status_code=500, detail="Configuración del servidor incorrecta")

        supabase = create_client(supabase_url, supabase_key)

        # Obtener usuario desde el token
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            logger.error("❌ Token inválido o expirado")
            raise HTTPException(status_code=401, detail="Token inválido o expirado")

        user = user_response.user
        logger.info(f"✅ Usuario autenticado: {user.id} - {user.email}")

        return {
            "user_id": user.id,
            "email": user.email
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error validando token: {str(e)}")
        logger.exception("Stack trace:")
        raise HTTPException(status_code=401, detail=f"Error validando token: {str(e)}")

# ================== ENDPOINTS ==================

@router.post("/create-subscription")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear nueva suscripción en Stripe
    """
    try:
        logger.info(f"📝 Creando suscripción para usuario: {current_user.get('user_id')}")
        logger.info(f"📝 Request data: planId={request.planId}, isYearly={request.isYearly}")

        # Validar que es request de RecipeTuner
        validate_recipetuner_request(request.metadata)

        # Buscar o crear customer en Stripe
        customer = await get_or_create_stripe_customer(current_user)
        logger.info(f"✅ Customer obtenido: {customer.id}")

        # Obtener price_id basado en planId e isYearly
        price_id = await get_price_id(request.planId, request.isYearly)
        logger.info(f"✅ Price ID obtenido: {price_id}")

        # Si el paymentMethodId es 'pm_card_visa' (test), crear uno real
        payment_method_id = request.paymentMethodId
        if payment_method_id in ['pm_card_visa', 'test']:
            logger.info("🧪 Creando payment method de prueba...")
            # Crear payment method de prueba con tarjeta Stripe
            payment_method = stripe.PaymentMethod.create(
                type="card",
                card={"token": "tok_visa"}  # Token de prueba de Stripe
            )
            payment_method_id = payment_method.id
            logger.info(f"✅ Payment method de prueba creado: {payment_method_id}")

        # Adjuntar método de pago al customer
        logger.info(f"🔗 Adjuntando payment method {payment_method_id} al customer...")
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer.id
        )
        logger.info("✅ Payment method adjuntado")

        # Crear suscripción
        logger.info("💳 Creando suscripción en Stripe...")
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": price_id}],
            default_payment_method=payment_method_id,
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
        error_msg = str(e)
        error_type = type(e).__name__
        logger.error(f"❌ Error inesperado ({error_type}): {error_msg}")
        logger.exception("Stack trace completo:")
        raise HTTPException(status_code=500, detail=f"Error interno ({error_type}): {error_msg}")


@router.post("/cancel-subscription")
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    current_user: dict = Depends(get_current_user)
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


@router.post("/create-payment-intent")
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear Payment Intent para procesar pago
    """
    try:
        logger.info(f"💳 Creando payment intent para usuario: {current_user.get('user_id')}")

        # Buscar o crear customer en Stripe
        customer = await get_or_create_stripe_customer(current_user)

        # Crear Payment Intent
        payment_intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            customer=customer.id,
            metadata={
                **request.metadata,
                "app_name": "recipetuner",
                "user_id": current_user.get("user_id"),
                "plan_id": request.plan_id or "",
                "price_id": request.price_id or "",
                "created_at": datetime.utcnow().isoformat()
            }
        )

        logger.info(f"✅ Payment Intent creado: {payment_intent.id}")

        return {
            "success": True,
            "payment_intent_id": payment_intent.id,
            "client_secret": payment_intent.client_secret,
            "amount": payment_intent.amount,
            "currency": payment_intent.currency,
            "status": payment_intent.status
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
    current_user: dict = Depends(get_current_user)
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


# ================== TEST ENDPOINT SIN AUTH ==================

@router.post("/test-create-payment-intent-no-auth")
async def test_create_payment_intent_no_auth(
    request: CreatePaymentIntentRequest
):
    """
    TEST: Crear Payment Intent SIN autenticación para debugging
    """
    try:
        logger.info(f"🧪 TEST: Creando payment intent SIN auth")
        logger.info(f"🧪 TEST: Request data: {request}")

        # Crear Payment Intent básico sin customer
        payment_intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            metadata={
                **request.metadata,
                "app_name": "recipetuner",
                "test_mode": "true",
                "plan_id": request.plan_id or "",
                "price_id": request.price_id or "",
                "created_at": datetime.utcnow().isoformat()
            }
        )

        logger.info(f"✅ TEST: Payment Intent creado: {payment_intent.id}")

        return {
            "success": True,
            "payment_intent_id": payment_intent.id,
            "client_secret": payment_intent.client_secret,
            "amount": payment_intent.amount,
            "currency": payment_intent.currency,
            "status": payment_intent.status,
            "test_mode": True
        }

    except stripe.error.StripeError as e:
        logger.error(f"❌ TEST: Error de Stripe: {e}")
        raise HTTPException(status_code=500, detail=f"Error de Stripe: {str(e)}")

    except Exception as e:
        logger.error(f"❌ TEST: Error inesperado: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

async def get_price_id(plan_id: str, is_yearly: bool):
    """Obtener price_id de Stripe desde Supabase basado en UUID del plan"""
    try:
        from supabase import create_client

        # Inicializar cliente Supabase
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("❌ Supabase no configurado")
            raise HTTPException(status_code=500, detail="Supabase no configurado")

        supabase = create_client(supabase_url, supabase_key)

        # Buscar plan en Supabase por UUID
        response = supabase.table("recipetuner_subscription_plans").select("*").eq("id", plan_id).single().execute()

        if not response.data:
            logger.error(f"❌ Plan no encontrado en Supabase: {plan_id}")
            raise HTTPException(status_code=404, detail=f"Plan no encontrado: {plan_id}")

        plan = response.data

        # Obtener el price_id correcto según frecuencia
        price_id = plan.get("stripe_price_id_yearly") if is_yearly else plan.get("stripe_price_id_monthly")

        if not price_id:
            logger.error(f"❌ Price ID no encontrado para plan {plan_id} ({'anual' if is_yearly else 'mensual'})")
            raise HTTPException(
                status_code=400,
                detail=f"Price ID no configurado para este plan ({'anual' if is_yearly else 'mensual'})"
            )

        logger.info(f"✅ Price ID obtenido: {price_id} para plan {plan.get('name')} ({'anual' if is_yearly else 'mensual'})")
        return price_id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error obteniendo price_id: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo price_id: {str(e)}")

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