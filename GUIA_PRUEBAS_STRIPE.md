# 🧪 Guía de Pruebas - Integración Stripe

## ✅ Estado Actual

### Backend Render:
```json
{
  "status": "healthy",
  "service": "RecipeTuner API",
  "integrations": {
    "stripe": true,
    "supabase": true
  }
}
```
✅ **Backend funcionando correctamente**

### Endpoints Configurados:
- ✅ `/api/create-payment-intent`
- ✅ `/api/create-subscription`
- ✅ `/api/cancel-subscription`
- ✅ `/api/update-payment-method`
- ✅ `/api/stripe/webhooks`

---

## 📋 CHECKLIST DE PRUEBAS

### 1. ✅ Verificar Planes en Supabase

**Query SQL:**
```sql
SELECT
    id,
    name,
    description,
    price,
    stripe_price_id,
    recipe_limit,
    features,
    is_active
FROM recipetuner_subscription_plans
ORDER BY price;
```

**Resultado esperado:**
- Plan FREE (0.00)
- Plan BASIC (precio mensual)
- Plan PREMIUM (precio mensual)
- Plan PRO (precio mensual)

**Verificar:**
- [ ] Todos los planes tienen `stripe_price_id`
- [ ] Todos los planes están activos (`is_active = true`)
- [ ] Los precios son correctos

---

### 2. 📱 Probar UI en la App

**Pasos:**
1. Abrir la app
2. Ir a **Perfil** → **Suscripciones**
3. Ver pantalla de planes

**Verificar:**
- [ ] Se cargan los planes desde Supabase
- [ ] Se muestran correctamente (nombre, precio, features)
- [ ] Botones de suscripción funcionan
- [ ] Se detecta la región (MX o US)
- [ ] Toggle mensual/anual funciona

---

### 3. 💳 Probar Flujo de Pago (TEST MODE)

**Tarjetas de prueba Stripe:**
```
✅ Éxito:              4242 4242 4242 4242
❌ Rechazo genérico:   4000 0000 0000 0002
⚠️ Requiere 3D Secure: 4000 0025 0000 3155
```

**Pasos:**
1. Seleccionar un plan (ej: BASIC)
2. Presionar "Suscribirse"
3. Ingresar datos de prueba:
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos
   - ZIP: Cualquier 5 dígitos

**Verificar:**
- [ ] Se abre el formulario de Stripe
- [ ] Se puede ingresar la tarjeta
- [ ] El pago se procesa
- [ ] Se crea la suscripción en Supabase
- [ ] Se actualiza el estado en la app

---

### 4. 🔗 Verificar Webhooks

**En Stripe Dashboard:**
1. Ir a Developers → Webhooks
2. Ver eventos recientes

**Eventos esperados:**
- `customer.created`
- `payment_intent.succeeded`
- `invoice.paid`
- `customer.subscription.created`

**Verificar:**
- [ ] Webhook URL configurada: `https://recipetunerclaude.onrender.com/api/stripe/webhooks`
- [ ] Eventos se reciben correctamente
- [ ] Sin errores en los logs

---

### 5. 💾 Verificar en Supabase

**Query SQL:**
```sql
-- Ver suscripción del usuario
SELECT
    u.email,
    s.status,
    s.current_period_end,
    sp.name as plan_name,
    sp.price
FROM recipetuner_subscriptions s
JOIN recipetuner_users u ON s.user_id = u.id
JOIN recipetuner_subscription_plans sp ON s.plan_id = sp.id
WHERE u.email = 'TU_EMAIL_AQUI'
ORDER BY s.created_at DESC;
```

**Verificar:**
- [ ] Suscripción se creó en la tabla
- [ ] Estado es `active`
- [ ] `stripe_subscription_id` está presente
- [ ] `current_period_end` es una fecha futura
- [ ] Plan correcto asociado

---

### 6. 🔄 Probar Cancelación

**Pasos:**
1. En la app, ir a suscripción activa
2. Presionar "Cancelar Suscripción"
3. Confirmar cancelación

**Verificar:**
- [ ] Se envía request a `/api/cancel-subscription`
- [ ] Stripe cancela la suscripción
- [ ] Estado en Supabase cambia a `canceled`
- [ ] Webhook `customer.subscription.deleted` se recibe
- [ ] UI se actualiza

---

### 7. 📊 Verificar Límites de Recetas

**Test:**
1. Con plan FREE: Intentar crear más recetas que el límite
2. Con plan BASIC/PREMIUM: Verificar límites correctos

**Query SQL:**
```sql
-- Contar recetas del usuario
SELECT COUNT(*) as total_recipes
FROM recipetuner_recipes
WHERE user_id = (
    SELECT id FROM recipetuner_users WHERE email = 'TU_EMAIL_AQUI'
);

-- Ver límite del plan
SELECT recipe_limit
FROM recipetuner_subscription_plans sp
JOIN recipetuner_subscriptions s ON s.plan_id = sp.id
JOIN recipetuner_users u ON s.user_id = u.id
WHERE u.email = 'TU_EMAIL_AQUI'
AND s.status = 'active';
```

**Verificar:**
- [ ] La app bloquea cuando se alcanza el límite
- [ ] Mensaje claro al usuario
- [ ] Opción de actualizar plan

---

## 🐛 TROUBLESHOOTING

### Error: "No se pudo crear el pago"
**Soluciones:**
1. Verificar que Stripe key esté en variables de entorno de Render
2. Verificar logs del backend: `https://dashboard.render.com/`
3. Verificar en Stripe Dashboard si hay errores

### Error: "Suscripción no se actualizó"
**Soluciones:**
1. Verificar que el webhook esté configurado
2. Verificar que el webhook secret sea correcto
3. Ver logs de webhooks en Stripe Dashboard

### Planes no se cargan
**Soluciones:**
1. Ejecutar query SQL para verificar planes en Supabase
2. Verificar RLS policies en tabla `recipetuner_subscription_plans`
3. Ver logs en la app

---

## 🔑 Variables de Entorno Requeridas

### En Render (Backend):
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...
```

### En App (expo-constants):
```bash
# En .env o app.json
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📞 CONTACTO STRIPE

- Dashboard: https://dashboard.stripe.com/
- Docs: https://stripe.com/docs
- Webhooks: https://dashboard.stripe.com/webhooks
- Test Cards: https://stripe.com/docs/testing

---

## ✅ RESULTADO ESPERADO

Después de las pruebas:
- ✅ Usuario puede ver planes
- ✅ Usuario puede suscribirse con tarjeta de prueba
- ✅ Suscripción se crea en Stripe y Supabase
- ✅ Webhooks funcionan correctamente
- ✅ Usuario puede cancelar suscripción
- ✅ Límites de recetas se respetan

---

**Estado:** Listo para probar
**Modo:** TEST (usar tarjetas de prueba)
**Fecha:** 2025-09-29