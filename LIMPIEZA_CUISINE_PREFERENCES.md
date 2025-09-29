# 🧹 Limpieza de Referencias a cuisine_preferences

## 📊 ANÁLISIS DE REFERENCIAS

### ✅ ARCHIVOS QUE MANTENER (son correctos o necesarios)

#### 1. `src/services/realmDatabaseV2.js`
- **Líneas 83, 98-111**: Código de migración v7→v8
- **Estado**: ✅ Correcto - Es código de migración que debe permanecer
- **Razón**: Documenta el proceso de migración histórico

### ❌ ARCHIVOS QUE REQUIEREN LIMPIEZA

#### 1. `src/services/realmSchemas.js` (SCHEMA VIEJO)
- **Línea 166**: `cuisinePreferences: 'string[]'`
- **Estado**: ❌ Obsoleto - Este archivo ya no se usa
- **Acción**: Archivo completo obsoleto (usar realmDatabaseV2.js)

#### 2. `src/services/realmDatabase.js` (DATABASE VIEJO)
- **Líneas 325, 340-341, 392**: Referencias a cuisinePreferences
- **Estado**: ❌ Obsoleto - Este archivo ya no se usa
- **Acción**: Archivo completo obsoleto (usar realmDatabaseV2.js)

#### 3. `src/services/realmPersistenceFix.js`
- **Línea 125**: `if (!newPref.cuisinePreferences) newPref.cuisinePreferences = [];`
- **Estado**: ⚠️ Puede necesitar actualización
- **Acción**: Revisar si este archivo aún se usa

#### 4. `src/screens/OnboardingScreen.js`
- **Líneas 23, 69**: Referencias a cuisinePreferences
- **Estado**: ❌ Debe actualizarse a dietType
- **Acción**: Cambiar a dietType

### 🗑️ ARCHIVOS IGNORAR (no requieren cambios)

- Todos los archivos `.bak` (backups)
- Archivos de test: `debugRealm.js`, `testPersistence.js`, `debugRealmPersistence.js`
- Servicios de storage de prueba: `mmkvService.js`, `asyncStorageService.js`, `secureStoreService.js`

---

## 🎯 PLAN DE LIMPIEZA

### Prioridad ALTA:
1. ✅ **OnboardingScreen.js** - Actualizar a dietType
   - Cambiar `cuisinePreferences` por `dietType`
   - Ajustar UI para selección única

### Prioridad MEDIA:
2. ⚠️ **realmPersistenceFix.js** - Verificar si se usa
   - Si se usa: actualizar a dietType
   - Si no se usa: marcar como obsoleto

### Prioridad BAJA:
3. 📝 **Archivos viejos** - Documentar como obsoletos
   - `realmSchemas.js` → Agregar comentario "OBSOLETO: usar realmDatabaseV2.js"
   - `realmDatabase.js` → Agregar comentario "OBSOLETO: usar realmDatabaseV2.js"

---

## 📋 RESULTADO ESPERADO

Después de la limpieza:
- ✅ OnboardingScreen usa `dietType`
- ✅ No hay referencias activas a `cuisinePreferences` en código en uso
- ✅ Código de migración preservado (histórico)
- ✅ Archivos viejos marcados como obsoletos
- ✅ Tests y backups sin tocar (no afectan producción)

---

## 🚀 EJECUCIÓN

### Paso 1: Actualizar OnboardingScreen
```javascript
// ANTES:
cuisinePreferences: [],

// DESPUÉS:
dietType: '',
```

### Paso 2: Verificar realmPersistenceFix
- Buscar imports de este archivo
- Si no se usa, agregar comentario de obsoleto

### Paso 3: Marcar archivos viejos
- Agregar banner "DEPRECATED" en la parte superior

---

**Estado**: Listo para ejecutar
**Impacto**: Bajo (la mayoría de archivos ya no se usan)
**Tiempo estimado**: 10-15 minutos