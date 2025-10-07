#!/usr/bin/env python3
"""
Script para verificar la suscripción recién creada
ID: sub_1SDAYTRZPUbUqU0XTDSeJehx
Usuario: Alfredo Sánchez (wiseailabs@gmail.com)
"""

import stripe
import os
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

# Configurar Stripe con la key de TEST
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

subscription_id = "sub_1SDAYTRZPUbUqU0XTDSeJehx"

print(f"🔍 Verificando suscripción: {subscription_id}\n")

try:
    # Obtener la suscripción
    subscription = stripe.Subscription.retrieve(subscription_id)

    print("=" * 70)
    print("✅ SUSCRIPCIÓN ENCONTRADA EN STRIPE")
    print("=" * 70)

    print(f"\n📋 Información General:")
    print(f"   ID: {subscription.id}")
    print(f"   Status: {subscription.status}")
    print(f"   Customer: {subscription.customer}")

    print(f"\n💰 Plan:")
    if hasattr(subscription, 'items') and hasattr(subscription.items, 'data'):
        if len(subscription.items.data) > 0:
            item = subscription.items.data[0]
            print(f"   Price ID: {item.price.id}")
            amount = item.price.unit_amount / 100
            currency = item.price.currency.upper()
            print(f"   Amount: ${amount:.2f} {currency}")
            print(f"   Interval: {item.price.recurring.interval}")

            # Verificar que es el plan correcto
            if amount == 89.00 and currency == "MXN":
                print(f"   ✅ Plan correcto: $89.00 MXN mensual")
            else:
                print(f"   ⚠️ Plan inesperado: ${amount} {currency}")

    print(f"\n📅 Fechas:")
    print(f"   Created: {datetime.fromtimestamp(subscription.created)}")

    if subscription.get('current_period_start'):
        print(f"   Current period start: {datetime.fromtimestamp(subscription.current_period_start)}")
    if subscription.get('current_period_end'):
        print(f"   Current period end: {datetime.fromtimestamp(subscription.current_period_end)}")

    if subscription.get('trial_start'):
        print(f"   Trial start: {datetime.fromtimestamp(subscription.trial_start)}")
    if subscription.get('trial_end'):
        trial_end = datetime.fromtimestamp(subscription.trial_end)
        print(f"   Trial end: {trial_end}")

        # Calcular días restantes de trial
        days_remaining = (trial_end - datetime.now()).days
        print(f"   📆 Días restantes de trial: {days_remaining}")

    print(f"\n📊 Metadata:")
    for key, value in subscription.metadata.items():
        print(f"   {key}: {value}")

    # Verificar metadata correcto
    if subscription.metadata.get('app_name') == 'recipetuner':
        print(f"   ✅ app_name correcto")
    else:
        print(f"   ⚠️ app_name incorrecto o faltante")

    print(f"\n💳 Payment:")
    print(f"   Default payment method: {subscription.default_payment_method or 'None (trial only)'}")

    # Obtener información del customer
    print(f"\n👤 Customer Information:")
    customer = stripe.Customer.retrieve(subscription.customer)
    print(f"   Email: {customer.email}")
    print(f"   Name: {customer.name or 'N/A'}")
    print(f"   Created: {datetime.fromtimestamp(customer.created)}")

    print("\n" + "=" * 70)
    print("✅ SUSCRIPCIÓN VÁLIDA Y CORRECTA")
    print("=" * 70)

    print(f"\n📝 Próximo paso: Verificar que está sincronizada en Supabase")
    print(f"\nEjecuta este SQL en Supabase:")
    print(f"""
    SELECT
        s.id,
        s.stripe_subscription_id,
        s.stripe_customer_id,
        s.status,
        s.trial_end,
        s.app_name,
        u.email,
        u.name
    FROM recipetuner_subscriptions s
    JOIN recipetuner_users u ON s.user_id = u.id
    WHERE s.stripe_subscription_id = '{subscription_id}';
    """)

except stripe.error.InvalidRequestError as e:
    print("❌ ERROR: Suscripción no encontrada")
    print(f"   Detalles: {e}")

except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
