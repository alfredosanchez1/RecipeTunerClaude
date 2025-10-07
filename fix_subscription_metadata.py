#!/usr/bin/env python3
"""
Script para corregir el metadata de la suscripción en Stripe
Actualizar el user_id correcto
"""

import stripe
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# ID de la suscripción
subscription_id = "sub_1SD7xdRZPUbUqU0XNeqo4hkh"
# ID del usuario correcto en Supabase
correct_user_id = "15cc6f59-e329-495b-ae4f-9b88218516e9"

print(f"🔧 Actualizando metadata de suscripción: {subscription_id}")
print(f"   Nuevo user_id: {correct_user_id}")
print("=" * 60)

try:
    # Obtener la suscripción actual
    subscription = stripe.Subscription.retrieve(subscription_id)

    print(f"\n📋 Metadata actual:")
    for key, value in subscription.metadata.items():
        print(f"   {key}: {value}")

    # Actualizar el metadata con el user_id correcto
    updated_subscription = stripe.Subscription.modify(
        subscription_id,
        metadata={
            **subscription.metadata,  # Mantener todo el metadata existente
            "user_id": correct_user_id  # Solo cambiar el user_id
        }
    )

    print(f"\n✅ Metadata actualizado:")
    for key, value in updated_subscription.metadata.items():
        print(f"   {key}: {value}")

    print("\n" + "=" * 60)
    print("✅ ¡METADATA ACTUALIZADO EXITOSAMENTE!")
    print("=" * 60)
    print("\nAhora los webhooks futuros usarán el user_id correcto.")
    print("La suscripción existente ya está en Supabase con el user_id correcto.")

except stripe.error.InvalidRequestError as e:
    print(f"\n❌ Error: Suscripción no encontrada")
    print(f"   Detalles: {e}")

except Exception as e:
    print(f"\n❌ Error inesperado: {e}")
    import traceback
    traceback.print_exc()
