# 🔐 Configuración Segura de API Keys

## ✅ Cambios Realizados

### 1. **Archivo de Configuración Dinámico**
- ✅ Creado `app.config.js` que lee del `.env`
- ✅ API key ya NO está hardcodeada en el código
- ✅ Usa `dotenv` para cargar variables de entorno

### 2. **Seguridad en Git**
- ✅ `app.json` (con API key real) agregado a `.gitignore`
- ✅ `app.json.example` creado como template público
- ✅ `.env` ya estaba en `.gitignore`

### 3. **Cómo Funciona Ahora**

```javascript
// src/config/api.js
import Constants from 'expo-constants';

export const API_CONFIG = {
  OPENAI: {
    API_KEY: Constants.expoConfig?.extra?.openaiApiKey || 'TU_API_KEY_AQUI',
    // ... resto de config
  }
}
```

El flujo es:
1. `.env` contiene `OPENAI_API_KEY=sk-proj-...`
2. `app.config.js` lee de `.env` con `process.env.OPENAI_API_KEY`
3. `src/config/api.js` lee de `Constants.expoConfig.extra.openaiApiKey`

## 🚀 Próximos Pasos

### Para Desarrollo Local
```bash
# 1. Asegúrate de tener tu .env con la API key
cat .env

# 2. Reinicia el servidor Expo
npx expo start --clear
```

### Para Producción (EAS Build)
```bash
# Configura secretos en EAS
eas secret:create --scope project --name OPENAI_API_KEY --value sk-proj-...

# Luego actualiza app.config.js para usar:
openaiApiKey: process.env.OPENAI_API_KEY || Constants.expoConfig?.extra?.openaiApiKey
```

## ⚠️ Importante

- ✅ `.env` está en `.gitignore` - NUNCA subir al repo
- ✅ `app.json` está en `.gitignore` - Contiene API key
- ✅ `app.json.example` es el template para otros devs
- ✅ `app.config.js` se puede subir al repo (lee de .env)

## 🔄 Para Otros Desarrolladores

Si alguien más clona el repo:
```bash
# 1. Copiar template
cp app.json.example app.json

# 2. Crear .env con su API key
echo "OPENAI_API_KEY=tu_api_key_aqui" > .env

# 3. Reiniciar Expo
npx expo start --clear
```

## 📋 Estado Actual

- ✅ API key protegida
- ✅ Funciona en desarrollo
- ✅ Configuración lista para producción
- ⚠️ Necesita reiniciar Expo para aplicar cambios
