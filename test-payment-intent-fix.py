#!/usr/bin/env python3
"""
Parche temporal para probar el endpoint create-payment-intent sin autenticación
"""

import sys
import os

# Agregar el directorio de server-endpoints al path
sys.path.append('/Users/luisalfredocazares/Desktop/RecipeTunerClaude/server-endpoints')

def create_test_endpoint():
    """Crear endpoint de prueba sin autenticación"""

    endpoint_code = '''
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
'''

    # Leer el archivo actual
    stripe_file = '/Users/luisalfredocazares/Desktop/RecipeTunerClaude/server-endpoints/stripe_endpoints.py'

    with open(stripe_file, 'r') as f:
        content = f.read()

    # Agregar el endpoint de prueba al final del archivo (antes del último cierre)
    if 'test-create-payment-intent-no-auth' not in content:
        # Encontrar dónde insertar el nuevo endpoint
        lines = content.split('\n')

        # Buscar el final de los endpoints pero antes de las funciones auxiliares
        insert_index = -1
        for i, line in enumerate(lines):
            if 'async def get_price_id' in line:
                insert_index = i
                break

        if insert_index > 0:
            # Insertar el nuevo endpoint
            lines.insert(insert_index, endpoint_code)

            # Escribir el archivo actualizado
            with open(stripe_file, 'w') as f:
                f.write('\n'.join(lines))

            print("✅ Endpoint de prueba agregado exitosamente")
            print("🔄 Reinicia el servidor para que tome efecto")
            print("🧪 Endpoint disponible en: /api/test-create-payment-intent-no-auth")
            return True
        else:
            print("❌ No se encontró ubicación para insertar endpoint")
            return False
    else:
        print("⚠️ El endpoint de prueba ya existe")
        return True

if __name__ == "__main__":
    create_test_endpoint()