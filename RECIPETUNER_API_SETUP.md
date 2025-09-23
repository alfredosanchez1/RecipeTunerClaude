# 🍳 RecipeTuner API - Servidor Independiente

## 📋 Resumen

Este es el servidor independiente para **RecipeTuner**, separado de **CalorieSnap** para mayor estabilidad y mantenimiento.

## 🚀 Configuración en Render

### 1. Crear Nuevo Servicio

1. Ir a [Render Dashboard](https://dashboard.render.com)
2. Crear **New Web Service**
3. Conectar este repositorio: `RecipeTunerClaude`
4. Configuración:
   - **Name**: `recipetuner-api`
   - **Environment**: `Python 3.11`
   - **Build Command**: `pip install -r server-endpoints/requirements.txt`
   - **Start Command**: `cd server-endpoints && python main.py`
   - **Port**: `10000`

### 2. Variables de Entorno

Copiar todas las variables del archivo `server-endpoints/render_env_config.txt`:

#### Stripe
```
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=[Configurar después del webhook]
```

#### Supabase
```
SUPABASE_URL=https://ipuqtmdljfirpbaxvygd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE
SUPABASE_SERVICE_ROLE_KEY=[Obtener de Supabase]
```

#### OpenAI
```
OPENAI_API_KEY=[Obtener de OpenAI]
```

### 3. Configurar Webhook en Stripe

1. Ir a [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint**:
   - **URL**: `https://recipetuner-api.onrender.com/api/stripe/webhooks`
   - **Events**:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. Copiar el **Signing Secret** y agregarlo como `STRIPE_WEBHOOK_SECRET`

## 🔗 URLs del Servidor

- **API Base**: `https://recipetuner-api.onrender.com`
- **Health Check**: `https://recipetuner-api.onrender.com/health`
- **Docs**: `https://recipetuner-api.onrender.com/docs`
- **Webhook**: `https://recipetuner-api.onrender.com/api/stripe/webhooks`

## 🧪 Verificación

### Health Check
```bash
curl https://recipetuner-api.onrender.com/health
```

Respuesta esperada:
```json
{
  "message": "🍳 RecipeTuner API Server",
  "status": "running",
  "version": "1.0.0"
}
```

### Test Stripe Subscription
```bash
curl -X POST https://recipetuner-api.onrender.com/api/create-subscription \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "premium_mexico",
    "isYearly": false,
    "paymentMethodId": "pm_test_card"
  }'
```

## 📁 Estructura del Servidor

```
server-endpoints/
├── main.py                    # 🎯 Servidor principal
├── stripe_endpoints.py        # 💳 Endpoints de Stripe
├── integration_helper.py      # 🔧 Funciones auxiliares
├── requirements.txt           # 📦 Dependencias
├── render_env_config.txt      # ⚙️ Variables de entorno
└── INSTRUCCIONES_IMPLEMENTACION.md
```

## 🔄 Deploy Workflow

1. **Hacer cambios** en el código
2. **Commit y push** al repositorio
3. **Render despliega automáticamente**
4. **Verificar** con health check

## ⚠️ Importante

- ✅ **Servidor separado** de CalorieSnap
- ✅ **No afecta** CalorieSnap en caso de problemas
- ✅ **Variables de entorno independientes**
- ✅ **Webhook URL específica** para RecipeTuner
- ✅ **Mantenimiento independiente**

## 🆘 Troubleshooting

### Error 500: "Stripe not configured"
- Verificar `STRIPE_SECRET_KEY` en variables de entorno
- Reiniciar servicio en Render

### Error 404: Endpoint not found
- Verificar que el deploy se completó
- Verificar logs en Render dashboard

### Webhook errors
- Verificar `STRIPE_WEBHOOK_SECRET`
- Verificar URL en Stripe dashboard

## 📞 Support

Para problemas específicos del servidor RecipeTuner, verificar:
1. Logs en Render dashboard
2. Health check endpoint
3. Variables de entorno configuradas