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
import asyncio
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

        # Obtener o validar payment method
        payment_method_id = request.paymentMethodId

        # Si no hay payment method o es placeholder, crear suscripción sin payment method (trial mode)
        if payment_method_id in ['pm_card_visa', 'test', None, '']:
            logger.info("🧪 Modo prueba: Creando suscripción SIN payment method (solo trial)")
            payment_method_id = None
        else:
            # Validar que el payment method existe
            try:
                pm = stripe.PaymentMethod.retrieve(payment_method_id)
                logger.info(f"✅ Payment method válido: {pm.id}")
            except stripe.error.InvalidRequestError as e:
                logger.error(f"❌ Payment method inválido: {e}")
                raise HTTPException(status_code=400, detail=f"Payment method inválido: {str(e)}")

        # Adjuntar método de pago al customer (solo si existe)
        if payment_method_id:
            logger.info(f"🔗 Adjuntando payment method {payment_method_id} al customer...")
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer.id
            )
            logger.info("✅ Payment method adjuntado")
        else:
            logger.info("⏭️ Sin payment method - suscripción solo con trial")

        # Crear suscripción
        logger.info("💳 Creando suscripción en Stripe...")
        subscription_params = {
            "customer": customer.id,
            "items": [{"price": price_id}],
            "trial_period_days": 7,  # 7 días de trial
            "metadata": {
                **request.metadata,
                "user_id": current_user.get("user_id"),
                "created_at": datetime.utcnow().isoformat()
            }
        }

        # Solo agregar default_payment_method si existe
        if payment_method_id:
            subscription_params["default_payment_method"] = payment_method_id

        subscription = stripe.Subscription.create(**subscription_params)

        logger.info(f"✅ Suscripción creada: {subscription.id}")
        logger.info(f"   📊 Status: {subscription.status}")
        logger.info(f"   🎁 Trial end: {subscription.trial_end}")

        # Obtener client_secret si existe (solo cuando hay payment method)
        client_secret = None
        if subscription.latest_invoice and isinstance(subscription.latest_invoice, str):
            # Si latest_invoice es un ID, obtener el invoice completo
            try:
                invoice = stripe.Invoice.retrieve(subscription.latest_invoice)
                if invoice.payment_intent and isinstance(invoice.payment_intent, str):
                    payment_intent = stripe.PaymentIntent.retrieve(invoice.payment_intent)
                    client_secret = payment_intent.client_secret
                elif hasattr(invoice.payment_intent, 'client_secret'):
                    client_secret = invoice.payment_intent.client_secret
            except Exception as e:
                logger.warning(f"⚠️ No se pudo obtener client_secret: {e}")
        elif hasattr(subscription, 'latest_invoice') and hasattr(subscription.latest_invoice, 'payment_intent'):
            if hasattr(subscription.latest_invoice.payment_intent, 'client_secret'):
                client_secret = subscription.latest_invoice.payment_intent.client_secret

        return {
            "success": True,
            "subscription_id": subscription.id,
            "client_secret": client_secret,
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
        logger.info(f"🚫 Cancelando suscripción: {request.subscriptionId}")

        # Obtener Supabase client
        supabase = await get_supabase_client()

        # Buscar el perfil del usuario actual
        auth_user_id = current_user.get('user_id')
        profile_result = supabase.table("recipetuner_users").select("id").eq("auth_user_id", auth_user_id).eq("app_name", "recipetuner").execute()

        if not profile_result.data or len(profile_result.data) == 0:
            raise HTTPException(status_code=404, detail="Perfil de usuario no encontrado")

        user_profile_id = profile_result.data[0]['id']
        logger.info(f"👤 Usuario actual profile_id: {user_profile_id}")

        # Verificar que la suscripción pertenece al usuario en Supabase
        subscription_result = supabase.table("recipetuner_subscriptions").select("*").eq("stripe_subscription_id", request.subscriptionId).eq("user_id", user_profile_id).execute()

        if not subscription_result.data or len(subscription_result.data) == 0:
            logger.warning(f"⚠️ Usuario {auth_user_id} intentó cancelar suscripción {request.subscriptionId} que no le pertenece")
            raise HTTPException(status_code=403, detail="No tienes permiso para cancelar esta suscripción")

        logger.info(f"✅ Suscripción verificada, pertenece al usuario")

        # Verificar que la suscripción existe en Stripe
        subscription = stripe.Subscription.retrieve(request.subscriptionId)
        if not subscription:
            raise HTTPException(status_code=404, detail="Suscripción no encontrada en Stripe")

        # Cancelar suscripción inmediatamente
        canceled_subscription = stripe.Subscription.delete(request.subscriptionId)

        logger.info(f"✅ Suscripción cancelada: {canceled_subscription.id}")

        # Actualizar en Supabase (ya tenemos el client arriba)
        supabase.table("recipetuner_subscriptions").update({
            "status": "canceled",
            "canceled_at": datetime.now().isoformat()
        }).eq("stripe_subscription_id", request.subscriptionId).execute()

        return {
            "success": True,
            "subscription_id": canceled_subscription.id,
            "status": canceled_subscription.status
        }

    except stripe.error.StripeError as e:
        logger.error(f"❌ Error de Stripe: {e}")
        logger.exception("Stack trace de Stripe:")
        raise HTTPException(status_code=500, detail=f"Error de Stripe: {str(e)}")

    except Exception as e:
        logger.error(f"❌ Error inesperado cancelando suscripción: {e}")
        logger.exception("Stack trace completo:")
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
    Soporta tanto modo TEST como PRODUCTION
    """
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')

        # Intentar obtener el secret de TEST primero, luego PRODUCTION
        # Si la API key es de test, usar test secret, si no, usar production secret
        stripe_api_key = stripe.api_key or ""
        is_test_mode = stripe_api_key.startswith("sk_test_")

        if is_test_mode:
            endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET_TEST')
            logger.info("🧪 Usando webhook secret de TEST")
        else:
            endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
            logger.info("🔴 Usando webhook secret de PRODUCTION")

        if not endpoint_secret:
            logger.error(f"❌ Webhook secret no configurado para modo {'TEST' if is_test_mode else 'PRODUCTION'}")
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

async def get_supabase_client():
    """Obtener cliente de Supabase"""
    from supabase import create_client

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise Exception("Supabase no configurado")

    return create_client(supabase_url, supabase_key)

async def handle_subscription_created(event):
    """Manejar suscripción creada"""
    subscription = event['data']['object']

    # Solo procesar eventos de RecipeTuner
    if subscription.get('metadata', {}).get('app_name') != 'recipetuner':
        logger.info(f"⏭️ Ignorando suscripción de otra app: {subscription.get('metadata', {}).get('app_name')}")
        return

    logger.info(f"🆕 Webhook: Suscripción creada: {subscription['id']}")

    try:
        supabase = await get_supabase_client()

        # Obtener auth_user_id desde metadata
        auth_user_id = subscription['metadata'].get('user_id')
        if not auth_user_id:
            logger.error("❌ No se encontró user_id en metadata")
            return

        # 🔧 BUSCAR EL ID DEL PERFIL EN recipetuner_users
        logger.info(f"🔍 Buscando perfil para auth_user_id: {auth_user_id}")
        profile_result = supabase.table("recipetuner_users").select("id").eq(
            "auth_user_id", auth_user_id
        ).eq("app_name", "recipetuner").execute()

        if not profile_result.data or len(profile_result.data) == 0:
            logger.error(f"❌ No se encontró perfil en recipetuner_users para auth_user_id: {auth_user_id}")
            return

        profile_id = profile_result.data[0]['id']
        logger.info(f"✅ Perfil encontrado: {profile_id}")

        # 🔍 Verificar si el usuario ya tiene suscripciones activas
        existing_subs = supabase.table("recipetuner_subscriptions").select("*").eq(
            "user_id", profile_id
        ).in_("status", ["active", "trialing"]).execute()

        # 🔄 Si hay suscripciones activas, manejar según el estado
        if existing_subs.data and len(existing_subs.data) > 0:
            logger.warning(f"⚠️ Usuario tiene {len(existing_subs.data)} suscripción(es) activa(s)")

            for old_sub in existing_subs.data:
                try:
                    old_stripe_sub_id = old_sub['stripe_subscription_id']
                    old_status = old_sub['status']

                    # Si está en trial, cancelar sin proration (no ha pagado)
                    if old_status == 'trialing':
                        logger.info(f"🆓 Cancelando trial sin proration: {old_stripe_sub_id}")
                        stripe.Subscription.delete(old_stripe_sub_id)

                        # Actualizar en Supabase
                        supabase.table("recipetuner_subscriptions").update({
                            "status": "canceled",
                            "canceled_at": datetime.now().isoformat()
                        }).eq("id", old_sub['id']).execute()

                        logger.info(f"✅ Trial cancelado: {old_stripe_sub_id}")

                    # Si está activa (pagada), usar proration
                    elif old_status == 'active':
                        logger.info(f"💰 Aplicando proration para suscripción activa: {old_stripe_sub_id}")

                        # Obtener el price_id de la nueva suscripción
                        new_price_id = subscription.get('items', {}).get('data', [{}])[0].get('price', {}).get('id')

                        if new_price_id:
                            # Modificar la suscripción existente en lugar de crear una nueva
                            updated_sub = stripe.Subscription.modify(
                                old_stripe_sub_id,
                                items=[{
                                    'id': stripe.Subscription.retrieve(old_stripe_sub_id).items.data[0].id,
                                    'price': new_price_id,
                                }],
                                proration_behavior='create_prorations',  # Genera crédito proporcional
                                metadata=subscription.get('metadata', {})
                            )

                            logger.info(f"✅ Suscripción actualizada con proration: {old_stripe_sub_id}")
                            logger.info(f"   💵 Nuevo price_id: {new_price_id}")

                            # No crear nueva suscripción, usar la modificada
                            subscription = updated_sub

                            # Actualizar en Supabase
                            supabase.table("recipetuner_subscriptions").update({
                                "status": updated_sub.status,
                                "current_period_start": datetime.fromtimestamp(updated_sub.current_period_start).isoformat(),
                                "current_period_end": datetime.fromtimestamp(updated_sub.current_period_end).isoformat()
                            }).eq("id", old_sub['id']).execute()

                            # No continuar con la inserción de nueva suscripción
                            return
                        else:
                            logger.warning(f"⚠️ No se encontró price_id en nueva suscripción, cancelando antigua")
                            stripe.Subscription.delete(old_stripe_sub_id)

                            supabase.table("recipetuner_subscriptions").update({
                                "status": "canceled",
                                "canceled_at": datetime.now().isoformat()
                            }).eq("id", old_sub['id']).execute()

                            logger.info(f"✅ Trial cancelado: {old_stripe_sub_id}")

                except Exception as cancel_error:
                    logger.error(f"❌ Error manejando suscripción antigua {old_stripe_sub_id}: {cancel_error}")
                    # Continuar de todos modos

        # Antes de insertar, marcar todas las suscripciones activas/trialing del usuario como canceladas
        # Esto previene el race condition del constraint user_active_unique
        try:
            logger.info(f"🔧 Marcando suscripciones antiguas del usuario como canceladas en Supabase...")
            supabase.table("recipetuner_subscriptions").update({
                "status": "canceled",
                "canceled_at": datetime.now().isoformat()
            }).eq("user_id", profile_id).in_("status", ["active", "trialing"]).execute()
            logger.info(f"✅ Suscripciones antiguas marcadas como canceladas")
        except Exception as cleanup_error:
            logger.warning(f"⚠️ Error limpiando suscripciones antiguas: {cleanup_error}")
            # Continuar de todos modos

        # Preparar datos para insertar
        subscription_data = {
            "user_id": profile_id,  # 🔧 Usar el ID del perfil, no auth_user_id
            "stripe_subscription_id": subscription['id'],
            "stripe_customer_id": subscription['customer'],
            "status": subscription['status'],
            "current_period_start": datetime.fromtimestamp(subscription['current_period_start']).isoformat() if subscription.get('current_period_start') else None,
            "current_period_end": datetime.fromtimestamp(subscription['current_period_end']).isoformat() if subscription.get('current_period_end') else None,
            "trial_start": datetime.fromtimestamp(subscription['trial_start']).isoformat() if subscription.get('trial_start') else None,
            "trial_end": datetime.fromtimestamp(subscription['trial_end']).isoformat() if subscription.get('trial_end') else None,
            "app_name": "recipetuner"
        }

        # Insertar nueva suscripción
        result = supabase.table("recipetuner_subscriptions").insert(
            subscription_data
        ).execute()

        logger.info(f"✅ Suscripción guardada en Supabase: {subscription['id']}")

    except Exception as e:
        logger.error(f"❌ Error guardando suscripción en Supabase: {e}")
        logger.exception("Stack trace:")

async def handle_subscription_updated(event):
    """Manejar suscripción actualizada"""
    subscription = event['data']['object']

    if subscription.get('metadata', {}).get('app_name') != 'recipetuner':
        logger.info(f"⏭️ Ignorando actualización de otra app")
        return

    logger.info(f"🔄 Webhook: Suscripción actualizada: {subscription['id']}")

    try:
        supabase = await get_supabase_client()

        # Actualizar datos
        subscription_data = {
            "status": subscription['status'],
            "current_period_start": datetime.fromtimestamp(subscription['current_period_start']).isoformat() if subscription.get('current_period_start') else None,
            "current_period_end": datetime.fromtimestamp(subscription['current_period_end']).isoformat() if subscription.get('current_period_end') else None,
            "trial_start": datetime.fromtimestamp(subscription['trial_start']).isoformat() if subscription.get('trial_start') else None,
            "trial_end": datetime.fromtimestamp(subscription['trial_end']).isoformat() if subscription.get('trial_end') else None,
            "canceled_at": datetime.fromtimestamp(subscription['canceled_at']).isoformat() if subscription.get('canceled_at') else None,
            "updated_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("recipetuner_subscriptions").update(
            subscription_data
        ).eq("stripe_subscription_id", subscription['id']).execute()

        logger.info(f"✅ Suscripción actualizada en Supabase: {subscription['id']}")

    except Exception as e:
        logger.error(f"❌ Error actualizando suscripción en Supabase: {e}")
        logger.exception("Stack trace:")

async def handle_subscription_deleted(event):
    """Manejar suscripción cancelada"""
    subscription = event['data']['object']

    if subscription.get('metadata', {}).get('app_name') != 'recipetuner':
        logger.info(f"⏭️ Ignorando cancelación de otra app")
        return

    logger.info(f"❌ Webhook: Suscripción cancelada: {subscription['id']}")

    try:
        supabase = await get_supabase_client()

        # Actualizar estado a cancelado
        subscription_data = {
            "status": "canceled",
            "canceled_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("recipetuner_subscriptions").update(
            subscription_data
        ).eq("stripe_subscription_id", subscription['id']).execute()

        logger.info(f"✅ Suscripción marcada como cancelada en Supabase: {subscription['id']}")

    except Exception as e:
        logger.error(f"❌ Error cancelando suscripción en Supabase: {e}")
        logger.exception("Stack trace:")

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