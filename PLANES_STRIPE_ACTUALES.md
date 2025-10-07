# 📊 Planes de Suscripción Actuales - RecipeTuner

## ✅ PLANES CONFIGURADOS EN SUPABASE

### 🇲🇽 Plan México
**ID:** `801e2929-b536-44c5-8dc4-1f0d81a4a08f`

| Campo | Valor |
|-------|-------|
| **Nombre** | RecipeTuner Completo México |
| **Precio Mensual** | $89.00 MXN |
| **Precio Anual** | $699.00 MXN (~$58.25/mes - ahorro 35%) |
| **Stripe Price ID Mensual** | `price_mexico_monthly_89mxn` |
| **Stripe Price ID Anual** | `price_mexico_yearly_699mxn` |
| **Max Recetas** | -1 (Ilimitado) |
| **Trial Days** | 7 días |
| **Estado** | ✅ Activo |

**Features:**
- ✅ Recetas ilimitadas
- ✅ Adaptaciones ilimitadas con IA
- ✅ Recetas personalizadas con IA
- ✅ Análisis nutricional avanzado
- ✅ Planificador de comidas semanal
- ✅ Lista de compras automática
- ✅ Exportar recetas a PDF
- ✅ Condiciones médicas
- ✅ Modo offline
- ✅ Sincronización múltiples dispositivos
- ✅ Acceso a recetas premium
- ✅ Soporte prioritario 24/7

---

### 🇺🇸 Plan USA
**ID:** `d8110fd0-c14c-446c-91a7-347bbc8bc131`

| Campo | Valor |
|-------|-------|
| **Nombre** | RecipeTuner Complete USA |
| **Precio Mensual** | $4.99 USD |
| **Precio Anual** | $39.99 USD (~$3.33/mes - ahorro 33%) |
| **Stripe Price ID Mensual** | `price_usa_monthly_499usd` |
| **Stripe Price ID Anual** | `price_usa_yearly_3999usd` |
| **Max Recetas** | -1 (Ilimitado) |
| **Trial Days** | 7 días |
| **Estado** | ✅ Activo |

**Features:**
- ✅ Unlimited recipes
- ✅ Unlimited AI adaptations
- ✅ AI-powered custom recipes
- ✅ Advanced nutritional analysis
- ✅ Weekly meal planner
- ✅ Automatic shopping lists
- ✅ Export recipes to PDF
- ✅ Medical conditions
- ✅ Offline mode
- ✅ Multi-device synchronization
- ✅ Access to premium recipes
- ✅ Priority 24/7 support

---

## 🎯 ESTRATEGIA DE PRECIOS

### Comparación de Planes:

| Característica | México | USA |
|----------------|--------|-----|
| **Precio Mensual** | $89 MXN | $4.99 USD |
| **Precio Anual** | $699 MXN | $39.99 USD |
| **Equivalente USD Mensual** | ~$5.23 USD | $4.99 USD |
| **Equivalente USD Anual** | ~$41.12 USD | $39.99 USD |
| **Ahorro Anual** | 35% | 33% |
| **Trial** | 7 días | 7 días |

### Pricing ajustado por región:
- ✅ México: Precio competitivo en MXN
- ✅ USA: Precio en USD
- ✅ Similar valor en ambas regiones
- ✅ Incentivo fuerte para suscripción anual

---

## 🔑 STRIPE PRICE IDs PARA VERIFICAR

Estos Price IDs deben existir en tu Dashboard de Stripe:

### México:
1. `price_mexico_monthly_89mxn` - Mensual $89 MXN
2. `price_mexico_yearly_699mxn` - Anual $699 MXN

### USA:
1. `price_usa_monthly_499usd` - Mensual $4.99 USD
2. `price_usa_yearly_3999usd` - Anual $39.99 USD

---

## ✅ VERIFICACIÓN EN STRIPE DASHBOARD

Ve a: https://dashboard.stripe.com/products

**Verifica que existan:**
- [ ] Producto "RecipeTuner México" con 2 precios (mensual y anual)
- [ ] Producto "RecipeTuner USA" con 2 precios (mensual y anual)
- [ ] Price IDs coinciden exactamente con los de Supabase
- [ ] Precios están en modo TEST (para pruebas)
- [ ] Todos los precios están activos

---

## 🧪 PRUEBAS A REALIZAR

### 1. Usuario en México:
```javascript
// Detectar región: MX
// Mostrar plan: $89 MXN/mes o $699 MXN/año
// Usar price_id: price_mexico_monthly_89mxn o price_mexico_yearly_699mxn
```

### 2. Usuario en USA:
```javascript
// Detectar región: US
// Mostrar plan: $4.99 USD/mes o $39.99 USD/año
// Usar price_id: price_usa_monthly_499usd o price_usa_yearly_3999usd
```

### 3. Tarjetas de prueba:
```
✅ Éxito:              4242 4242 4242 4242
❌ Rechazo:            4000 0000 0000 0002
🇲🇽 Tarjeta México:    4000 0048 4000 0001
🇺🇸 Tarjeta USA:       4242 4242 4242 4242
```

---

## 📱 FLUJO EN LA APP

1. Usuario abre "Suscripciones"
2. App detecta región (MX o US)
3. Muestra plan correcto según región
4. Usuario selecciona mensual o anual (toggle)
5. Usuario presiona "Suscribirse"
6. Stripe muestra formulario de pago
7. Usuario ingresa tarjeta de prueba
8. Pago se procesa
9. Webhook actualiza Supabase
10. App muestra suscripción activa

---

## 🚨 IMPORTANTE

⚠️ **Estos Price IDs DEBEN existir en Stripe Dashboard**

Si NO existen:
1. Ve a https://dashboard.stripe.com/products
2. Crea productos con esos Price IDs exactos
3. O actualiza los Price IDs en Supabase con los existentes

---

**Estado:** ✅ Planes configurados en Supabase
**Siguiente paso:** Verificar Price IDs en Stripe Dashboard
**Fecha:** 2025-09-29