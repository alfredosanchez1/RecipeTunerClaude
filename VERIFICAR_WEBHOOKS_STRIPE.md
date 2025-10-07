# 🔔 Verificación de Webhooks Stripe - RecipeTuner

## ✅ Estado Actual

- ✅ Backend en Render: **ACTIVO**
- ✅ Stripe configurado: **SÍ**
- ✅ Endpoint webhooks: `https://recipetunerclaude.onrender.com/api/stripe/webhooks`
- ✅ Fix de tipo de dato: `amount` convertido a string

---

## 🎯 PASOS PARA VERIFICAR WEBHOOKS

### 1. Acceder a Stripe Dashboard

Ve a: https://dashboard.stripe.com/test/webhooks

### 2. Verificar Webhook Endpoint

Debe existir un webhook con esta configuración:

**URL del endpoint:**
```
https://recipetunerclaude.onrender.com/api/stripe/webhooks
```

**Eventos a escuchar:**
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### 3. Si NO existe el webhook, crearlo:

1. Click en **"Add endpoint"**
2. Pegar la URL: `https://recipetunerclaude.onrender.com/api/stripe/webhooks`
3. Click en **"Select events"**
4. Buscar y seleccionar los 6 eventos listados arriba
5. Click en **"Add endpoint"**
6. **IMPORTANTE**: Copiar el **Signing secret** (webhook secret)
7. Ir a Render → Environment Variables
8. Actualizar `STRIPE_WEBHOOK_SECRET` con el nuevo valor

### 4. Si SÍ existe el webhook:

1. Click en el webhook
2. Verificar que está en estado **"Enabled"**
3. Verificar que los 6 eventos estén seleccionados
4. Verificar que el signing secret está configurado en Render

---

## 🧪 PRUEBA MANUAL DE WEBHOOK

### Desde Stripe Dashboard:

1. Ve al webhook
2. Click en **"Send test webhook"**
3. Selecciona evento: `customer.subscription.created`
4. Click en **"Send test webhook"**
5. Verifica que aparezca: **✅ Succeeded** (código 200)

### ¿Qué debe pasar?

- **200 OK**: Webhook procesado correctamente
- **401 Unauthorized**: Signing secret incorrecto
- **500 Error**: Problema en el backend

---

## 🔍 VERIFICAR EN TIEMPO REAL

### Durante una prueba de suscripción:

1. Abre Stripe Dashboard en una pestaña
2. Ve a: https://dashboard.stripe.com/test/events
3. En la app, intenta suscribirte con tarjeta de prueba: `4242 4242 4242 4242`
4. Observa en Stripe Events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `invoice.payment_succeeded`

### En Supabase:

Ve a `recipetuner_subscriptions` y verifica que se creó un registro:

```sql
SELECT
    id,
    user_id,
    plan_id,
    stripe_subscription_id,
    status,
    start_date,
    end_date,
    created_at
FROM recipetuner_subscriptions
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📊 FLUJO COMPLETO ESPERADO

```
1. Usuario presiona "Suscribirse" en la app
   ↓
2. App llama a /api/create-subscription con:
   - planId
   - paymentMethodId
   - metadata (amount, currency, etc.)
   ↓
3. Backend crea sesión de Stripe
   ↓
4. Stripe procesa el pago
   ↓
5. Stripe envía webhook a tu backend
   ↓
6. Backend recibe webhook y actualiza Supabase
   ↓
7. App verifica suscripción activa
   ↓
8. Usuario ve "Suscripción Activa" ✅
```

---

## 🚨 TROUBLESHOOTING

### Error: "Webhook signature verification failed"
**Solución**: Verificar que `STRIPE_WEBHOOK_SECRET` en Render coincida con el de Stripe Dashboard

### Error: "No route matched with those values"
**Solución**: Verificar que la URL del webhook sea exactamente:
`https://recipetunerclaude.onrender.com/api/stripe/webhooks`

### Error: "Connection timeout"
**Solución**: Verificar que el servicio en Render esté activo y no en sleep mode

### No se crea registro en Supabase
**Solución**:
1. Verificar que el webhook esté recibiendo eventos (check Stripe Dashboard)
2. Verificar logs en Render
3. Verificar que el user_id exista en `recipetuner_users`

---

## ✅ CHECKLIST FINAL

Antes de marcar como completado:

- [ ] Webhook existe en Stripe Dashboard
- [ ] Webhook tiene los 6 eventos configurados
- [ ] Webhook está en estado "Enabled"
- [ ] Signing secret está en Render como `STRIPE_WEBHOOK_SECRET`
- [ ] Prueba de webhook desde Dashboard retorna 200 OK
- [ ] Prueba de suscripción en app crea registro en Supabase
- [ ] Usuario ve "Suscripción Activa" en la app

---

**Fecha**: 2025-09-29
**Estado**: 📋 Pendiente de verificación