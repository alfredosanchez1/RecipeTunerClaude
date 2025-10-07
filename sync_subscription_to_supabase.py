#!/usr/bin/env python3
"""
Script para sincronizar una suscripción específica de Stripe a Supabase
Simula un webhook de subscription.created
"""

import stripe
import os
from dotenv import load_dotenv
from datetime import datetime
from supabase import create_client

# Cargar variables de entorno
load_dotenv()

# Configurar Stripe y Supabase
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Error: Variables de Supabase no configuradas")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

# ID de la suscripción a sincronizar
subscription_id = "sub_1SD7xdRZPUbUqU0XNeqo4hkh"

print(f"🔄 Sincronizando suscripción: {subscription_id}")
print("=" * 60)

try:
    # Obtener la suscripción de Stripe
    subscription = stripe.Subscription.retrieve(subscription_id)

    print(f"\n✅ Suscripción obtenida de Stripe:")
    print(f"   ID: {subscription.id}")
    print(f"   Status: {subscription.status}")
    print(f"   Customer: {subscription.customer}")
    print(f"   Metadata: {subscription.metadata}")

    # Verificar que es de RecipeTuner
    if subscription.metadata.get('app_name') != 'recipetuner':
        print("\n⚠️ Advertencia: Esta suscripción no es de RecipeTuner")
        print(f"   app_name encontrado: {subscription.metadata.get('app_name')}")

    # Preparar datos para Supabase
    subscription_data = {
        "user_id": subscription.metadata.get('user_id'),
        "stripe_subscription_id": subscription.id,
        "stripe_customer_id": subscription.customer,
        "status": subscription.status,
        "current_period_start": datetime.fromtimestamp(subscription.get('current_period_start')).isoformat() if subscription.get('current_period_start') else None,
        "current_period_end": datetime.fromtimestamp(subscription.get('current_period_end')).isoformat() if subscription.get('current_period_end') else None,
        "trial_start": datetime.fromtimestamp(subscription.get('trial_start')).isoformat() if subscription.get('trial_start') else None,
        "trial_end": datetime.fromtimestamp(subscription.get('trial_end')).isoformat() if subscription.get('trial_end') else None,
        "app_name": "recipetuner"
    }

    print(f"\n📤 Enviando a Supabase...")
    print(f"   user_id: {subscription_data['user_id']}")
    print(f"   status: {subscription_data['status']}")
    print(f"   trial_end: {subscription_data['trial_end']}")

    # Insertar o actualizar en Supabase (upsert)
    result = supabase.table("recipetuner_subscriptions").upsert(
        subscription_data,
        on_conflict="stripe_subscription_id"
    ).execute()

    print(f"\n✅ ¡SINCRONIZACIÓN EXITOSA!")
    print("=" * 60)
    print(f"\n🎉 La suscripción {subscription_id} ahora está en Supabase")
    print("\n📝 Verifica en Supabase SQL Editor:")
    print("""
    SELECT
        id,
        user_id,
        stripe_subscription_id,
        status,
        trial_end,
        created_at
    FROM recipetuner_subscriptions
    WHERE stripe_subscription_id = 'sub_1SD7xdRZPUbUqU0XNeqo4hkh';
    """)

except stripe.error.InvalidRequestError as e:
    print(f"\n❌ Error: Suscripción no encontrada en Stripe")
    print(f"   Detalles: {e}")

except Exception as e:
    print(f"\n❌ Error inesperado: {e}")
    import traceback
    traceback.print_exc()
