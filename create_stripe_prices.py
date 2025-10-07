#!/usr/bin/env python3
"""
Script para crear productos y precios en Stripe (test mode)
Para RecipeTuner - Planes México y USA
"""

import stripe
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar Stripe con la key de TEST
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

print("🚀 Iniciando creación de productos y precios en Stripe...")
print(f"📝 Usando API key: {stripe.api_key[:20]}...")

# Verificar que es test mode
if not stripe.api_key or not stripe.api_key.startswith("sk_test_"):
    print("❌ ERROR: Debes usar una API key de TEST (sk_test_...)")
    print("❌ Por seguridad, este script solo funciona en modo TEST")
    exit(1)

print("✅ Modo TEST confirmado\n")

# ==================== PLAN MÉXICO ====================

print("🇲🇽 Creando producto para México...")

try:
    # Verificar si el producto ya existe
    products = stripe.Product.list(limit=100)
    mexico_product = None

    for product in products.data:
        if product.name == "RecipeTuner México":
            mexico_product = product
            print(f"✅ Producto México ya existe: {product.id}")
            break

    if not mexico_product:
        mexico_product = stripe.Product.create(
            name="RecipeTuner México",
            description="Plan completo de RecipeTuner para México - Recetas ilimitadas con IA",
            metadata={
                "app": "recipetuner",
                "region": "MX"
            }
        )
        print(f"✅ Producto México creado: {mexico_product.id}")

    # Crear precio mensual México
    print("💰 Creando precio mensual México...")
    try:
        mexico_monthly = stripe.Price.create(
            product=mexico_product.id,
            unit_amount=8900,  # $89.00 MXN en centavos
            currency="mxn",
            recurring={"interval": "month"},
            nickname="Plan Mensual México",
            metadata={
                "app": "recipetuner",
                "region": "MX",
                "billing_period": "monthly"
            }
        )
        print(f"✅ Precio mensual México creado: {mexico_monthly.id}")
        print(f"   💵 $89.00 MXN/mes")
    except stripe.error.StripeError as e:
        print(f"⚠️ Error creando precio mensual México: {e}")
        # Si ya existe, intentar obtenerlo
        prices = stripe.Price.list(product=mexico_product.id, active=True)
        for price in prices.data:
            if price.recurring and price.recurring.interval == "month":
                mexico_monthly = price
                print(f"✅ Usando precio mensual existente: {price.id}")
                break

    # Crear precio anual México
    print("💰 Creando precio anual México...")
    try:
        mexico_yearly = stripe.Price.create(
            product=mexico_product.id,
            unit_amount=69900,  # $699.00 MXN en centavos
            currency="mxn",
            recurring={"interval": "year"},
            nickname="Plan Anual México",
            metadata={
                "app": "recipetuner",
                "region": "MX",
                "billing_period": "yearly"
            }
        )
        print(f"✅ Precio anual México creado: {mexico_yearly.id}")
        print(f"   💵 $699.00 MXN/año (~$58.25/mes - ahorro 35%)\n")
    except stripe.error.StripeError as e:
        print(f"⚠️ Error creando precio anual México: {e}")
        prices = stripe.Price.list(product=mexico_product.id, active=True)
        for price in prices.data:
            if price.recurring and price.recurring.interval == "year":
                mexico_yearly = price
                print(f"✅ Usando precio anual existente: {price.id}\n")
                break

except Exception as e:
    print(f"❌ Error con producto México: {e}\n")
    exit(1)

# ==================== PLAN USA ====================

print("🇺🇸 Creando producto para USA...")

try:
    # Verificar si el producto ya existe
    usa_product = None

    for product in products.data:
        if product.name == "RecipeTuner USA":
            usa_product = product
            print(f"✅ Producto USA ya existe: {product.id}")
            break

    if not usa_product:
        usa_product = stripe.Product.create(
            name="RecipeTuner USA",
            description="Complete RecipeTuner plan for USA - Unlimited AI-powered recipes",
            metadata={
                "app": "recipetuner",
                "region": "US"
            }
        )
        print(f"✅ Producto USA creado: {usa_product.id}")

    # Crear precio mensual USA
    print("💰 Creando precio mensual USA...")
    try:
        usa_monthly = stripe.Price.create(
            product=usa_product.id,
            unit_amount=499,  # $4.99 USD en centavos
            currency="usd",
            recurring={"interval": "month"},
            nickname="Monthly Plan USA",
            metadata={
                "app": "recipetuner",
                "region": "US",
                "billing_period": "monthly"
            }
        )
        print(f"✅ Precio mensual USA creado: {usa_monthly.id}")
        print(f"   💵 $4.99 USD/month")
    except stripe.error.StripeError as e:
        print(f"⚠️ Error creando precio mensual USA: {e}")
        prices = stripe.Price.list(product=usa_product.id, active=True)
        for price in prices.data:
            if price.recurring and price.recurring.interval == "month":
                usa_monthly = price
                print(f"✅ Usando precio mensual existente: {price.id}")
                break

    # Crear precio anual USA
    print("💰 Creando precio anual USA...")
    try:
        usa_yearly = stripe.Price.create(
            product=usa_product.id,
            unit_amount=3999,  # $39.99 USD en centavos
            currency="usd",
            recurring={"interval": "year"},
            nickname="Annual Plan USA",
            metadata={
                "app": "recipetuner",
                "region": "US",
                "billing_period": "yearly"
            }
        )
        print(f"✅ Precio anual USA creado: {usa_yearly.id}")
        print(f"   💵 $39.99 USD/year (~$3.33/month - 33% off)\n")
    except stripe.error.StripeError as e:
        print(f"⚠️ Error creando precio anual USA: {e}")
        prices = stripe.Price.list(product=usa_product.id, active=True)
        for price in prices.data:
            if price.recurring and price.recurring.interval == "year":
                usa_yearly = price
                print(f"✅ Usando precio anual existente: {price.id}\n")
                break

except Exception as e:
    print(f"❌ Error con producto USA: {e}\n")
    exit(1)

# ==================== RESUMEN ====================

print("=" * 60)
print("🎉 ¡PRODUCTOS Y PRECIOS CREADOS EXITOSAMENTE!")
print("=" * 60)
print("\n📋 RESUMEN DE PRICE IDs CREADOS:\n")

print("🇲🇽 MÉXICO:")
print(f"   Mensual: {mexico_monthly.id}")
print(f"   Anual:   {mexico_yearly.id}")

print("\n🇺🇸 USA:")
print(f"   Mensual: {usa_monthly.id}")
print(f"   Anual:   {usa_yearly.id}")

print("\n" + "=" * 60)
print("📝 SIGUIENTE PASO:")
print("=" * 60)
print("\n⚠️  IMPORTANTE: Ahora debes actualizar estos Price IDs en Supabase")
print("\n1. Ve a Supabase SQL Editor")
print("2. Ejecuta el siguiente SQL:\n")

print(f"""
-- Actualizar plan México
UPDATE recipetuner_subscription_plans
SET
    stripe_price_id_monthly = '{mexico_monthly.id}',
    stripe_price_id_yearly = '{mexico_yearly.id}'
WHERE id = '801e2929-b536-44c5-8dc4-1f0d81a4a08f';

-- Actualizar plan USA
UPDATE recipetuner_subscription_plans
SET
    stripe_price_id_monthly = '{usa_monthly.id}',
    stripe_price_id_yearly = '{usa_yearly.id}'
WHERE id = 'd8110fd0-c14c-446c-91a7-347bbc8bc131';

-- Verificar actualización
SELECT id, name, stripe_price_id_monthly, stripe_price_id_yearly
FROM recipetuner_subscription_plans
WHERE is_active = true;
""")

print("\n✅ ¡Listo! Una vez actualices Supabase, podrás probar las suscripciones.")
print("🔗 Stripe Dashboard: https://dashboard.stripe.com/test/products\n")
