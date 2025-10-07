# 🚀 Migración Supabase: Medical Conditions

## 📋 **Resumen**
Esta migración agrega el campo `medical_conditions` a la tabla `recipetuner_user_preferences` para soportar las nuevas condiciones médicas en las preferencias de usuario.

---

## 🔧 **Instrucciones paso a paso**

### **Paso 1: Acceder al Dashboard de Supabase**
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto RecipeTuner

### **Paso 2: Abrir el SQL Editor**
1. En el menú lateral, busca **"SQL Editor"**
2. Haz clic en **"SQL Editor"**
3. Clic en **"New query"** para crear una nueva consulta

### **Paso 3: Ejecutar la Migración**
1. Abre el archivo `supabase_migration_medical_conditions.sql`
2. **Copia todo el contenido** del archivo
3. **Pega el contenido** en el SQL Editor de Supabase
4. Haz clic en **"Run"** o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### **Paso 4: Verificar la Migración**
Deberías ver una salida similar a esta:
```
✅ Migration Applied Successfully
📊 Total records: X
📊 Records with medical_conditions: X
✅ NUEVO CAMPO: medical_conditions added
```

---

## 🎯 **¿Qué hace esta migración?**

### **Campos agregados:**
- ✅ `medical_conditions` - JSON array para condiciones médicas
- ✅ Valor por defecto: `[]` (array vacío)
- ✅ Validación: Solo acepta arrays JSON válidos
- ✅ Índice optimizado para consultas rápidas

### **Datos afectados:**
- ✅ **Compatibilidad total** con registros existentes
- ✅ **Sin pérdida de datos** - todos los campos actuales se mantienen
- ✅ **Valores por defecto** aplicados automáticamente

### **Ejemplo de datos:**
```json
{
  "dietary_restrictions": ["Vegetariano", "Sin Gluten"],
  "allergies": ["Lácteos"],
  "medical_conditions": ["diabetes_type2", "hypertension"]
}
```

---

## 🔄 **Si algo sale mal (Rollback)**

### **Opción 1: Rollback completo**
1. Abre el archivo `supabase_rollback_medical_conditions.sql`
2. Copia y pega en el SQL Editor
3. Ejecuta - esto eliminará el campo `medical_conditions`

### **Opción 2: Rollback manual**
```sql
-- Solo eliminar la columna
ALTER TABLE recipetuner_user_preferences
DROP COLUMN medical_conditions;
```

---

## 🧪 **Pruebas después de la migración**

### **Verificar estructura de tabla:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'recipetuner_user_preferences'
ORDER BY ordinal_position;
```

### **Probar inserción de datos:**
```sql
-- Esto debe funcionar sin errores
UPDATE recipetuner_user_preferences
SET medical_conditions = '["diabetes_type2", "hypertension"]'::json
WHERE user_id = YOUR_USER_ID;
```

---

## 🚨 **Notas importantes**

### **✅ Seguridad:**
- ✅ Script idempotente (se puede ejecutar múltiples veces)
- ✅ No afecta datos existentes
- ✅ Incluye validaciones de integridad

### **⚡ Rendimiento:**
- ✅ Índice GIN para consultas rápidas en JSON
- ✅ Constraints para validar datos
- ✅ Valores por defecto optimizados

### **🔧 Compatibilidad:**
- ✅ Compatible con versiones anteriores de la app
- ✅ El campo es opcional
- ✅ La app funciona con o sin la migración

---

## 📞 **Si necesitas ayuda**

### **Error común: "Column already exists"**
```
✅ SOLUCIÓN: El script es idempotente, esto significa que ya se ejecutó exitosamente antes.
```

### **Error común: "Permission denied"**
```
❌ PROBLEMA: No tienes permisos de administrador en Supabase
✅ SOLUCIÓN: Asegúrate de estar logueado como owner del proyecto
```

### **Error común: "Table not found"**
```
❌ PROBLEMA: La tabla recipetuner_user_preferences no existe
✅ SOLUCIÓN: Verifica que estés en el proyecto correcto de RecipeTuner
```

---

## ✅ **Checklist de completación**

- [ ] Accedí al dashboard de Supabase
- [ ] Abrí el SQL Editor
- [ ] Copié el contenido de `supabase_migration_medical_conditions.sql`
- [ ] Ejecuté la migración exitosamente
- [ ] Vi el mensaje "Migration Applied Successfully"
- [ ] Probé la app y las preferencias médicas funcionan
- [ ] (Opcional) Guardé el script de rollback para emergencias

**🎉 ¡Migración completada! Las condiciones médicas ya están disponibles en Supabase.**