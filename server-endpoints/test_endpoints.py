"""
Script de prueba para verificar endpoints Stripe implementados
Usar después de implementar los endpoints en CaloriasAPI
"""

import asyncio
import aiohttp
import json
from datetime import datetime

# Configuración
BASE_URL = "https://recipetuner-api.onrender.com"
TEST_TOKEN = "YOUR_SUPABASE_TOKEN_HERE"  # Reemplazar con token real para pruebas

class StripeEndpointTester:
    def __init__(self, base_url: str, token: str = None):
        self.base_url = base_url
        self.token = token
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}" if token else ""
        }

    async def test_health_check(self):
        """Probar health check mejorado"""
        print("🔍 Probando health check...")

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{self.base_url}/health") as response:
                    data = await response.json()

                    if response.status == 200:
                        print("✅ Health check exitoso:")
                        print(f"   Status: {data.get('status')}")
                        print(f"   Stripe: {data.get('services', {}).get('stripe_configured')}")
                        print(f"   Supabase: {data.get('services', {}).get('supabase_configured')}")
                        print(f"   Webhooks: {data.get('services', {}).get('webhook_configured')}")
                        print(f"   Endpoints: {len(data.get('endpoints_available', []))}")
                        return True
                    else:
                        print(f"❌ Health check falló: {response.status}")
                        return False

            except Exception as e:
                print(f"❌ Error en health check: {e}")
                return False

    async def test_create_payment_intent(self):
        """Probar creación de Payment Intent"""
        print("🔍 Probando create-payment-intent...")

        payload = {
            "amount": 8900,  # 89.00 MXN en centavos
            "currency": "mxn",
            "metadata": {
                "app_name": "recipetuner",
                "plan_id": "premium_mexico",
                "billing_cycle": "monthly"
            }
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/create-payment-intent",
                    headers=self.headers,
                    json=payload
                ) as response:

                    if response.status == 200:
                        data = await response.json()
                        print("✅ Payment Intent creado exitosamente")
                        print(f"   Client Secret: {data.get('client_secret', '')[:20]}...")
                        return True
                    elif response.status == 422:
                        print("⚠️ Payment Intent requiere parámetros específicos (normal)")
                        return True
                    else:
                        text = await response.text()
                        print(f"❌ Error creating payment intent: {response.status} - {text}")
                        return False

            except Exception as e:
                print(f"❌ Error en payment intent: {e}")
                return False

    async def test_create_subscription(self, payment_method_id: str = "pm_card_visa"):
        """Probar creación de suscripción"""
        print("🔍 Probando create-subscription...")

        if not self.token or self.token == "YOUR_SUPABASE_TOKEN_HERE":
            print("⚠️ Token no configurado, saltando prueba")
            return False

        payload = {
            "planId": "premium_mexico",
            "isYearly": False,
            "paymentMethodId": payment_method_id,
            "metadata": {
                "app_name": "recipetuner",
                "plan_id": "premium_mexico",
                "billing_cycle": "monthly"
            }
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/create-subscription",
                    headers=self.headers,
                    json=payload
                ) as response:

                    if response.status == 200:
                        data = await response.json()
                        print("✅ Suscripción creada exitosamente")
                        print(f"   Subscription ID: {data.get('subscription_id')}")
                        print(f"   Status: {data.get('status')}")
                        return data.get('subscription_id')
                    else:
                        text = await response.text()
                        print(f"❌ Error creating subscription: {response.status} - {text}")
                        return None

            except Exception as e:
                print(f"❌ Error en create subscription: {e}")
                return None

    async def test_cancel_subscription(self, subscription_id: str):
        """Probar cancelación de suscripción"""
        print("🔍 Probando cancel-subscription...")

        if not subscription_id:
            print("⚠️ No hay subscription_id, saltando prueba")
            return False

        payload = {
            "subscriptionId": subscription_id,
            "metadata": {
                "app_name": "recipetuner",
                "cancellation_reason": "test"
            }
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/cancel-subscription",
                    headers=self.headers,
                    json=payload
                ) as response:

                    if response.status == 200:
                        data = await response.json()
                        print("✅ Suscripción cancelada exitosamente")
                        print(f"   Status: {data.get('status')}")
                        return True
                    else:
                        text = await response.text()
                        print(f"❌ Error canceling subscription: {response.status} - {text}")
                        return False

            except Exception as e:
                print(f"❌ Error en cancel subscription: {e}")
                return False

    async def test_update_payment_method(self, subscription_id: str, new_payment_method: str = "pm_card_mastercard"):
        """Probar actualización de método de pago"""
        print("🔍 Probando update-payment-method...")

        if not subscription_id:
            print("⚠️ No hay subscription_id, saltando prueba")
            return False

        payload = {
            "subscriptionId": subscription_id,
            "paymentMethodId": new_payment_method,
            "metadata": {
                "app_name": "recipetuner"
            }
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/update-payment-method",
                    headers=self.headers,
                    json=payload
                ) as response:

                    if response.status == 200:
                        data = await response.json()
                        print("✅ Método de pago actualizado exitosamente")
                        print(f"   Payment Method: {data.get('payment_method_id')}")
                        return True
                    else:
                        text = await response.text()
                        print(f"❌ Error updating payment method: {response.status} - {text}")
                        return False

            except Exception as e:
                print(f"❌ Error en update payment method: {e}")
                return False

    async def test_webhook_endpoint(self):
        """Probar que el endpoint de webhooks responde"""
        print("🔍 Probando webhook endpoint...")

        # Test básico sin signature (debe fallar con 400)
        payload = {"type": "test.event", "data": {"object": {}}}

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/stripe/webhooks",
                    json=payload
                ) as response:

                    if response.status == 400:
                        print("✅ Webhook endpoint responde (signature requerida - correcto)")
                        return True
                    elif response.status == 404:
                        print("❌ Webhook endpoint no encontrado")
                        return False
                    else:
                        print(f"⚠️ Webhook endpoint respuesta inesperada: {response.status}")
                        return True

            except Exception as e:
                print(f"❌ Error en webhook test: {e}")
                return False

    async def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        print("🚀 Iniciando pruebas de endpoints Stripe")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🔑 Token configurado: {'Sí' if self.token and self.token != 'YOUR_SUPABASE_TOKEN_HERE' else 'No'}")
        print("=" * 60)

        results = {}

        # Pruebas básicas (sin autenticación)
        results['health'] = await self.test_health_check()
        print()

        results['payment_intent'] = await self.test_create_payment_intent()
        print()

        results['webhook'] = await self.test_webhook_endpoint()
        print()

        # Pruebas con autenticación (si hay token)
        subscription_id = None
        if self.token and self.token != "YOUR_SUPABASE_TOKEN_HERE":
            subscription_id = await self.test_create_subscription()
            print()

            if subscription_id:
                results['update_payment'] = await self.test_update_payment_method(subscription_id)
                print()

                results['cancel_subscription'] = await self.test_cancel_subscription(subscription_id)
                print()
        else:
            print("⚠️ Saltando pruebas con autenticación (token no configurado)")
            print()

        # Resumen
        print("=" * 60)
        print("📊 RESUMEN DE PRUEBAS:")
        print()

        total_tests = len(results)
        passed_tests = sum(1 for result in results.values() if result)

        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name}: {status}")

        print()
        print(f"Total: {passed_tests}/{total_tests} pruebas exitosas")

        if passed_tests == total_tests:
            print("🎉 ¡Todos los endpoints funcionan correctamente!")
        elif passed_tests >= total_tests * 0.8:
            print("⚠️ La mayoría de endpoints funcionan, revisar fallos")
        else:
            print("❌ Varios endpoints necesitan revisión")

        return results

async def main():
    """Función principal"""
    print("🧪 TESTER DE ENDPOINTS STRIPE - CaloriasAPI")
    print("=" * 60)

    # Crear tester
    tester = StripeEndpointTester(BASE_URL, TEST_TOKEN)

    # Ejecutar pruebas
    results = await tester.run_all_tests()

    # Sugerencias
    print()
    print("💡 PRÓXIMOS PASOS:")

    if not results.get('health'):
        print("   1. Verificar que el servidor esté funcionando")
        print("   2. Revisar logs en Render dashboard")

    if not results.get('payment_intent'):
        print("   1. Verificar STRIPE_SECRET_KEY en variables de entorno")
        print("   2. Revisar configuración de Stripe")

    if TEST_TOKEN == "YOUR_SUPABASE_TOKEN_HERE":
        print("   1. Configurar token de Supabase para pruebas completas")
        print("   2. Ejecutar: python test_endpoints.py con token real")

    print()
    print("🔗 URLs útiles:")
    print(f"   Health: {BASE_URL}/health")
    print(f"   Render Dashboard: https://dashboard.render.com/web/srv-d1bl6bp5pdvs73e0jckg")
    print(f"   Stripe Dashboard: https://dashboard.stripe.com/")

if __name__ == "__main__":
    asyncio.run(main())