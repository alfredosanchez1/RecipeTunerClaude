# 🚀 Instrucciones de Implementación - Endpoints Stripe

## 📋 **Resumen**

He creado todos los endpoints faltantes para completar tu integración Stripe. Aquí están las instrucciones paso a paso para implementarlos en tu servidor RecipeTuner API en Render.

---

## 📁 **Archivos Creados**

1. **`stripe_endpoints.py`** - Endpoints principales de Stripe
2. **`integration_helper.py`** - Funciones auxiliares de Supabase
3. **`main_app_integration.py`** - Código de integración con tu app
4. **`requirements.txt`** - Dependencias adicionales
5. **`env_example.txt`** - Variables de entorno requeridas

---

## 🛠️ **Paso 1: Instalar Dependencias**

Agregar estas dependencias a tu `requirements.txt` en Render:

```txt
stripe>=7.0.0
supabase>=2.0.0
python-dotenv>=1.0.0
```

---

## 🔧 **Paso 2: Configurar Variables de Entorno en Render**

En tu dashboard de Render (`https://dashboard.render.com/web/srv-d1bl6bp5pdvs73e0jckg`), agregar estas variables:

### **Variables Stripe**
```
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=[Obtener del dashboard de Stripe]
```

### **Variables Supabase**
```
SUPABASE_URL=https://ipuqtmdljfirpbaxvygd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE
SUPABASE_SERVICE_ROLE_KEY=[Obtener de Supabase Dashboard]
```

### **Variables de Price IDs (Actualizar con valores reales)**
```
PRICE_MEXICO_MONTHLY=price_1234567890abcdef
PRICE_MEXICO_YEARLY=price_0987654321fedcba
PRICE_USA_MONTHLY=price_abcdef1234567890
PRICE_USA_YEARLY=price_fedcba0987654321
```

---

## 📝 **Paso 3: Integrar Código en tu App**

### **A. Agregar archivos a tu proyecto:**

1. Subir `stripe_endpoints.py` a tu repositorio
2. Subir `integration_helper.py` a tu repositorio
3. Actualizar tu `main.py` principal

### **B. Modificar tu `main.py`:**

```python
from fastapi import FastAPI
from stripe_endpoints import router as stripe_router
from main_app_integration import initialize_stripe_integration, health_check_enhanced

# Tu app existente
app = FastAPI(title="RecipeTuner API", version="1.1.0")

# Inicializar Stripe
initialize_stripe_integration()

# Agregar endpoints Stripe
app.include_router(stripe_router, tags=["Stripe Subscriptions"])

# Actualizar health check
@app.get("/health")
async def health():
    return await health_check_enhanced()

# ... resto de tu código existente
```

---

## 🔗 **Paso 4: Configurar Webhook en Stripe**

### **A. Ir al Dashboard de Stripe:**
1. Ir a `https://dashboard.stripe.com/webhooks`
2. Hacer clic en "Add endpoint"

### **B. Configurar el endpoint:**
```
URL: https://recipetuner-api.onrender.com/api/stripe/webhooks
Eventos:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

### **C. Copiar Webhook Secret:**
- Copiar el `Signing secret` generado
- Agregarlo como variable `STRIPE_WEBHOOK_SECRET` en Render

---

## 📊 **Paso 5: Crear/Verificar Productos en Stripe**

### **A. Productos RecipeTuner:**

#### **Producto México:**
```
Nombre: RecipeTuner Premium - México
Price IDs:
- Mensual (89 MXN): price_xxxxx
- Anual (699 MXN): price_xxxxx
```

#### **Producto USA:**
```
Nombre: RecipeTuner Premium - USA
Price IDs:
- Mensual ($4.99 USD): price_xxxxx
- Anual ($39.99 USD): price_xxxxx
```

### **B. Actualizar Price IDs:**
- Copiar los Price IDs reales de Stripe
- Actualizar las variables de entorno en Render
- Modificar el mapeo en `stripe_endpoints.py`:

```python
PRICE_MAPPING = {
    "premium_mexico": {
        "monthly": "price_TU_PRICE_ID_REAL",
        "yearly": "price_TU_PRICE_ID_REAL"
    },
    "premium_usa": {
        "monthly": "price_TU_PRICE_ID_REAL",
        "yearly": "price_TU_PRICE_ID_REAL"
    }
}
```

---

## 🧪 **Paso 6: Probar la Implementación**

### **A. Verificar Health Check:**
```bash
curl https://recipetuner-api.onrender.com/health
```

Debe devolver:
```json
{
  "status": "healthy",
  "services": {
    "stripe_configured": true,
    "supabase_configured": true,
    "webhook_configured": true
  },
  "endpoints_available": [
    "/create-payment-intent",
    "/create-subscription",
    "/cancel-subscription",
    "/update-payment-method",
    "/api/stripe/webhooks"
  ]
}
```

### **B. Probar endpoints (con token válido):**

```bash
# Test create-subscription
curl -X POST https://recipetuner-api.onrender.com/create-subscription \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "premium_mexico",
    "isYearly": false,
    "paymentMethodId": "pm_test_card",
    "metadata": {
      "app_name": "recipetuner",
      "plan_id": "premium_mexico",
      "billing_cycle": "monthly"
    }
  }'
```

---

## 🔒 **Paso 7: Configuración de Seguridad**

### **A. Variables sensibles en Render:**
- ✅ Usar variables de entorno (no hardcodear)
- ✅ `STRIPE_SECRET_KEY` debe empezar con `sk_live_`
- ✅ `STRIPE_WEBHOOK_SECRET` debe empezar con `whsec_`

### **B. Validación de tokens:**
- ✅ Todos los endpoints requieren autenticación
- ✅ Validación con Supabase implementada
- ✅ Metadata `app_name: "recipetuner"` obligatoria

---

## 📈 **Endpoints Implementados**

| Endpoint | Método | Descripción | Estado |
|----------|--------|-------------|--------|
| `/create-subscription` | POST | Crear suscripción Stripe | ✅ Implementado |
| `/cancel-subscription` | POST | Cancelar suscripción | ✅ Implementado |
| `/update-payment-method` | POST | Actualizar método de pago | ✅ Implementado |
| `/api/stripe/webhooks` | POST | Procesar webhooks Stripe | ✅ Implementado |

---

## 🔄 **Paso 8: Deploy y Verificación**

### **A. Deploy en Render:**
1. Hacer commit de los archivos nuevos
2. Push al repositorio
3. Render hará deploy automáticamente
4. Verificar logs en Render dashboard

### **B. Verificación final:**
```bash
# Verificar que tu app sigue respondiendo
curl https://recipetuner-api.onrender.com/health

# Probar desde tu app RecipeTuner
# Los endpoints ahora deben funcionar correctamente
```

---

## 🆘 **Troubleshooting**

### **Errores comunes:**

#### **500 Error: "Stripe key not configured"**
- Verificar que `STRIPE_SECRET_KEY` esté configurada en Render
- Reiniciar el servicio en Render

#### **401 Error: "Token inválido"**
- Verificar que el token de Supabase es válido
- Verificar `SUPABASE_SERVICE_ROLE_KEY` configurada

#### **404 Error: "Webhook signature invalid"**
- Verificar `STRIPE_WEBHOOK_SECRET` en variables de entorno
- Verificar URL webhook en Stripe dashboard

#### **422 Error: "Plan no válido"**
- Actualizar Price IDs en el código
- Verificar que los productos existen en Stripe

---

## ✅ **Checklist Final**

- [ ] Dependencias instaladas en `requirements.txt`
- [ ] Variables de entorno configuradas en Render
- [ ] Archivos subidos al repositorio
- [ ] Código integrado en `main.py`
- [ ] Webhook configurado en Stripe dashboard
- [ ] Productos y precios creados en Stripe
- [ ] Price IDs actualizados en el código
- [ ] Deploy exitoso en Render
- [ ] Health check respondiendo correctamente
- [ ] Endpoints probados con token válido

---

## 🎉 **Resultado Final**

Una vez completados estos pasos, tendrás:

- ✅ **Integración Stripe 100% funcional**
- ✅ **Todos los endpoints implementados**
- ✅ **Webhooks configurados**
- ✅ **App RecipeTuner conectada al servidor**
- ✅ **Sistema de suscripciones completo**

**¡Tu CaloriasFotoAPP/RecipeTuner ya podrá procesar pagos y gestionar suscripciones completamente!**