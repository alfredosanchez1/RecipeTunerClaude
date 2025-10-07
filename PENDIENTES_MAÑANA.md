# 📋 Pendientes para Mañana - RecipeTuner

**Fecha**: 2025-09-30
**Última actualización**: 2025-09-29 (noche)

---

## 🎯 PRIORIDAD ALTA - Stripe Subscription

### 1. ✅ Verificar Deployment en Render
**Estado**: ⏳ Pendiente (deployment en progreso)

**Acciones**:
- [ ] Verificar que el deployment se completó: https://dashboard.render.com/
- [ ] Verificar logs en Render para confirmar que el servicio arrancó sin errores
- [ ] Probar endpoint de health: `curl https://recipetunerclaude.onrender.com/health`

**Commit reciente**: `27c06894` - Fix Stripe payment method automático

---

### 2. 🧪 Probar Flujo de Suscripción Completo

**Estado**: ⏳ Pendiente de prueba

**Pasos a seguir**:
1. Abrir la app RecipeTuner
2. Ir a pantalla "Suscripciones"
3. Verificar que muestre el plan correcto (México o USA según región)
4. Presionar "Suscribirse"
5. Observar logs en terminal de Expo

**Resultado esperado**:
- ✅ Backend crea payment method automáticamente con `tok_visa`
- ✅ Backend crea suscripción en Stripe
- ✅ App recibe `subscription_id` y muestra mensaje de éxito
- ✅ App muestra "Suscripción Activa" con detalles del plan

**Si falla**:
- Revisar logs en Render para ver el error específico
- Revisar logs en terminal de Expo
- El error debería tener más detalle ahora con el logging mejorado

---

### 3. 🔍 Verificar Suscripción en Stripe Dashboard

**Estado**: ⏳ Pendiente

**Pasos**:
1. Ir a: https://dashboard.stripe.com/test/subscriptions
2. Buscar la suscripción creada
3. Verificar:
   - ✅ Customer creado
   - ✅ Payment method adjuntado
   - ✅ Suscripción activa (o en trial)
   - ✅ Metadata incluye `app_name: recipetuner`

---

### 4. 🔔 Verificar Webhooks de Stripe

**Estado**: ⏳ Pendiente

**Documento de referencia**: `VERIFICAR_WEBHOOKS_STRIPE.md`

**Pasos**:
1. Ir a: https://dashboard.stripe.com/test/webhooks
2. Verificar que existe webhook con URL: `https://recipetunerclaude.onrender.com/api/stripe/webhooks`
3. Verificar eventos configurados:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Enviar webhook de prueba desde Dashboard
5. Verificar que retorna 200 OK

**Si no existe el webhook**:
- Crearlo siguiendo las instrucciones en `VERIFICAR_WEBHOOKS_STRIPE.md`
- Copiar el **Signing Secret**
- Actualizar variable `STRIPE_WEBHOOK_SECRET` en Render

---

### 5. 📊 Verificar Registro en Supabase

**Estado**: ⏳ Pendiente

**Después de crear una suscripción exitosa**:

```sql
-- Ejecutar en Supabase SQL Editor
SELECT
    id,
    user_id,
    plan_id,
    stripe_subscription_id,
    status,
    start_date,
    end_date,
    trial_end_date,
    created_at
FROM recipetuner_subscriptions
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado**:
- ✅ Nuevo registro creado
- ✅ `stripe_subscription_id` coincide con el de Stripe Dashboard
- ✅ `status` es "active" o "trialing"
- ✅ `user_id` coincide con el usuario actual

**Si NO aparece el registro**:
- Verificar que los webhooks estén configurados
- Verificar logs en Render cuando llega el webhook
- Revisar handlers de webhooks en `stripe_endpoints.py`

---

## 🔧 PRIORIDAD MEDIA - Mejoras de UX

### 6. 📱 Mejorar Pantalla de Suscripción

**Estado**: 💡 Sugerencia

**Problemas actuales**:
- La app muestra "pantallas de Payment Intent" confusas
- No muestra formulario para tarjeta
- El flujo no es claro para el usuario

**Soluciones propuestas**:

#### Opción A: Usar Stripe Checkout (más rápido)
- Crear Checkout Session en backend
- Abrir URL de Stripe Checkout en WebView
- Usuario ingresa tarjeta en página segura de Stripe
- Redirigir de vuelta a la app

#### Opción B: Usar @stripe/stripe-react-native (más nativo)
- Instalar: `npx expo install @stripe/stripe-react-native`
- Usar `<CardField>` componente para capturar tarjeta
- Crear Payment Method en el cliente
- Enviar al backend para crear suscripción

#### Opción C: Simplificar para pruebas (temporal)
- Usar solo tarjeta de prueba automática (ya implementado)
- Agregar botón "Probar con tarjeta de prueba"
- Mostrar mensaje claro de que es modo prueba
- Para producción, implementar Opción A o B

**Recomendación**: Opción C para pruebas, luego Opción A para producción

---

### 7. 🎨 Mejorar Mensajes de Estado

**Estado**: 💡 Sugerencia

**Cambios recomendados**:

```javascript
// En lugar de mostrar pantallas de Payment Intent:
// Mostrar estados claros:

1. Estado: "Preparando suscripción..."
   - Loading spinner
   - Mensaje: "Configurando tu plan..."

2. Estado: "Procesando pago..."
   - Loading spinner
   - Mensaje: "Creando método de pago seguro..."

3. Estado: "Finalizando..."
   - Loading spinner
   - Mensaje: "Activando tu suscripción..."

4. Estado: "¡Éxito!"
   - Checkmark verde
   - Mensaje personalizado con detalles del plan
   - Botón: "Comenzar a usar Premium"
```

---

## 📚 PRIORIDAD BAJA - Documentación y Limpieza

### 8. 📖 Documentar Flujo de Suscripción

**Estado**: 💡 Sugerencia

**Crear documento**: `STRIPE_SUBSCRIPTION_FLOW.md`

**Contenido**:
- Diagrama del flujo completo
- Descripción de cada paso
- Manejo de errores
- Testing checklist
- Troubleshooting común

---

### 9. 🧹 Limpiar Código de Prueba

**Estado**: 💡 Sugerencia

**Acciones**:
- Revisar y limpiar logs excesivos
- Remover código comentado innecesario
- Consolidar funciones duplicadas
- Agregar comentarios explicativos

---

### 10. 🔐 Revisar Seguridad

**Estado**: 💡 Sugerencia

**Checklist de seguridad**:
- [ ] Verificar que API keys no estén en código
- [ ] Verificar que .env está en .gitignore
- [ ] Verificar que tokens se validen correctamente
- [ ] Verificar RLS policies en Supabase
- [ ] Verificar webhook signature validation

---

## 🚨 ISSUES CONOCIDOS

### Issue 1: Error 500 al crear suscripción
**Estado**: 🔧 Fix aplicado (pendiente de verificar)

**Problema**: Backend retornaba error 500 con detalle vacío

**Causa raíz**:
- Backend esperaba `plan_id` hardcoded ("premium_mexico")
- App enviaba UUID de Supabase
- `paymentMethodId` "pm_card_visa" no existía

**Fix aplicado**:
- Modificar `get_price_id()` para consultar Supabase por UUID
- Crear payment method automático con `tok_visa`
- Agregar logging detallado

**Commits**:
- `132d8c2e` - Fix get_price_id con Supabase
- `27c06894` - Fix payment method automático

**Verificación pendiente**: Probar en app después del deployment

---

### Issue 2: Pantallas confusas de Payment Intent
**Estado**: ⚠️ Conocido, no crítico

**Problema**: App muestra múltiples ventanas de Payment Intent sin formulario de tarjeta

**Causa**: Flujo de UI no optimizado para el caso de uso actual

**Solución propuesta**: Ver punto #6 (Mejorar Pantalla de Suscripción)

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### ✅ Completado:
- ✅ Backend Stripe configurado y desplegado en Render
- ✅ Planes de suscripción en Supabase (México y USA)
- ✅ Price IDs creados en Stripe
- ✅ Detección automática de región (MX/US)
- ✅ Fix de tipo de dato (amount como string)
- ✅ Fix de get_price_id (consulta Supabase)
- ✅ Fix de payment method (creación automática)
- ✅ Logging mejorado para debugging

### ⏳ En progreso:
- ⏳ Deployment en Render (último commit: `27c06894`)
- ⏳ Prueba end-to-end de suscripción

### 🔜 Pendiente:
- 🔜 Configuración de webhooks en Stripe
- 🔜 Verificación de sincronización con Supabase
- 🔜 Mejoras de UX en pantalla de suscripción
- 🔜 Testing con tarjeta real (después de pruebas)

---

## 🛠️ RECURSOS ÚTILES

### Documentación creada:
- `PLANES_STRIPE_ACTUALES.md` - Planes configurados
- `VERIFICAR_WEBHOOKS_STRIPE.md` - Guía de webhooks
- `TEST_STRIPE_PLANS.sql` - Query para verificar planes
- `test-stripe-quick.sh` - Script de verificación rápida

### Endpoints importantes:
- Health: https://recipetunerclaude.onrender.com/health
- Docs: https://recipetunerclaude.onrender.com/docs
- Stripe Dashboard: https://dashboard.stripe.com/test
- Render Dashboard: https://dashboard.render.com/

### Comandos útiles:
```bash
# Verificar health del backend
curl -s https://recipetunerclaude.onrender.com/health | python3 -m json.tool

# Ver planes en Supabase
# Ejecutar TEST_STRIPE_PLANS.sql en Supabase SQL Editor

# Ver logs de Render
# Ir a Dashboard → Logs
```

---

## 📝 NOTAS IMPORTANTES

1. **Stripe está en modo TEST**: Todas las pruebas usan test API keys
2. **Tarjeta de prueba**: `4242 4242 4242 4242` (cualquier fecha futura, cualquier CVC)
3. **Trial period**: 7 días configurados en todos los planes
4. **Región auto-detectada**: Basada en timezone del dispositivo
5. **Backend auto-deploy**: Render despliega automáticamente al hacer push a master

---

## ✅ CHECKLIST PARA MAÑANA

### Inicio del día:
- [ ] Verificar que Render deployment está completo
- [ ] Verificar health endpoint
- [ ] Revisar logs de Render (errores durante la noche)

### Pruebas de Stripe:
- [ ] Probar suscripción en app
- [ ] Verificar en Stripe Dashboard
- [ ] Configurar webhooks si no existen
- [ ] Verificar registro en Supabase

### Si todo funciona:
- [ ] Documentar el flujo funcionando
- [ ] Planear mejoras de UX
- [ ] Considerar migrar a producción

### Si hay errores:
- [ ] Revisar logs detallados en Render
- [ ] Revisar logs en terminal de Expo
- [ ] Identificar paso específico que falla
- [ ] Aplicar fix y volver a desplegar

---

**¡Buen trabajo hoy! 🎉**

Hemos avanzado significativamente en la integración de Stripe. Los principales bloqueadores están resueltos, solo falta verificar que funcione end-to-end después del deployment.

---

**Última actualización**: 2025-09-29 21:00
**Próxima sesión**: 2025-09-30 mañana