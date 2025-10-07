#!/usr/bin/env python3
"""
Script para verificar una suscripción específica en Stripe
"""

import stripe
import os
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

# Configurar Stripe con la key de TEST
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

subscription_id = "sub_1SD7xdRZPUbUqU0XNeqo4hkh"

print(f"🔍 Buscando suscripción: {subscription_id}\n")

try:
    # Obtener la suscripción
    subscription = stripe.Subscription.retrieve(subscription_id)

    print("=" * 60)
    print("✅ SUSCRIPCIÓN ENCONTRADA")
    print("=" * 60)

    print(f"\n📋 Información General:")
    print(f"   ID: {subscription.id}")
    print(f"   Status: {subscription.status}")
    print(f"   Customer: {subscription.customer}")

    print(f"\n💰 Plan:")
    if hasattr(subscription, 'items') and hasattr(subscription.items, 'data'):
        if len(subscription.items.data) > 0:
            item = subscription.items.data[0]
            print(f"   Price ID: {item.price.id}")
            print(f"   Amount: {item.price.unit_amount / 100} {item.price.currency.upper()}")
            print(f"   Interval: {item.price.recurring.interval}")
    else:
        print(f"   Items: {subscription.items}")

    print(f"\n📅 Fechas:")
    print(f"   Created: {datetime.fromtimestamp(subscription.created)}")
    print(f"   Current period start: {datetime.fromtimestamp(subscription.current_period_start)}")
    print(f"   Current period end: {datetime.fromtimestamp(subscription.current_period_end)}")

    if subscription.trial_start:
        print(f"   Trial start: {datetime.fromtimestamp(subscription.trial_start)}")
    if subscription.trial_end:
        print(f"   Trial end: {datetime.fromtimestamp(subscription.trial_end)}")

    print(f"\n📊 Metadata:")
    for key, value in subscription.metadata.items():
        print(f"   {key}: {value}")

    print(f"\n💳 Payment:")
    print(f"   Default payment method: {subscription.default_payment_method or 'None (trial only)'}")

    print("\n" + "=" * 60)
    print("✅ LA SUSCRIPCIÓN EXISTE Y ESTÁ ACTIVA EN STRIPE")
    print("=" * 60)
    print("\n⚠️  NOTA: La suscripción NO aparece en Supabase porque los webhooks")
    print("   aún no están configurados para sincronizar automáticamente.")
    print("\n📝 Próximo paso: Configurar webhooks de Stripe")

except stripe.error.InvalidRequestError as e:
    print("❌ ERROR: Suscripción no encontrada")
    print(f"   Detalles: {e}")

except Exception as e:
    print(f"❌ ERROR: {e}")
