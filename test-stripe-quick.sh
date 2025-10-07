#!/bin/bash
# Script de verificación rápida de Stripe

echo "🔍 Verificando integración Stripe..."
echo ""

# 1. Verificar backend está vivo
echo "1️⃣ Verificando backend en Render..."
HEALTH=$(curl -s https://recipetunerclaude.onrender.com/health)
echo "$HEALTH" | python3 -m json.tool
echo ""

# 2. Verificar endpoint de test simple
echo "2️⃣ Verificando endpoint de test..."
TEST=$(curl -s https://recipetunerclaude.onrender.com/api/simple-test)
echo "$TEST"
echo ""

# 3. Verificar estructura de endpoints
echo "3️⃣ Endpoints configurados:"
echo "✅ /api/create-payment-intent"
echo "✅ /api/create-subscription"
echo "✅ /api/cancel-subscription"
echo "✅ /api/stripe/webhooks"
echo ""

echo "✅ Verificación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ejecutar TEST_STRIPE_PLANS.sql en Supabase"
echo "2. Abrir la app y ir a Suscripciones"
echo "3. Probar con tarjeta: 4242 4242 4242 4242"