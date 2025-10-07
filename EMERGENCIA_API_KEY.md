# 🚨 ACCIÓN URGENTE REQUERIDA - API KEY COMPROMETIDA

## ⚠️ SITUACIÓN ACTUAL

Tu API key de OpenAI **YA ESTÁ** en el historial de Git:
```
Commit: 0c187f72 - "🍳 RecipeTuner: Configuración de servidor independiente"
```

Si este repositorio se ha subido a GitHub, la API key está **EXPUESTA PÚBLICAMENTE**.

## 🔴 PASOS URGENTES A SEGUIR

### 1. **REGENERAR API KEY INMEDIATAMENTE** ⚠️ MUY IMPORTANTE

1. Ve a https://platform.openai.com/api-keys
2. Encuentra tu API key actual: `sk-proj-GjAB...SL8A`
3. Click en "Revoke" o "Delete" para deshabilitarla
4. Crea una nueva API key
5. Guarda la nueva key en tu `.env`:
   ```bash
   echo "OPENAI_API_KEY=nueva_key_aqui" > .env
   ```

### 2. **LIMPIAR HISTORIAL DE GIT** (Después de regenerar la key)

```bash
# Opción A: Remover app.json del historial (recomendado)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch app.json" \
  --prune-empty --tag-name-filter cat -- --all

# Opción B: Si ya subiste a GitHub, forzar push
git push origin --force --all
git push origin --force --tags
```

### 3. **VERIFICAR QUE .gitignore FUNCIONE**

```bash
# Verificar que app.json esté ignorado
cat .gitignore | grep app.json

# Debería mostrar:
# app.json
```

### 4. **USAR app.config.js EN SU LUGAR**

```bash
# app.config.js lee de .env (ya está configurado)
npx expo start --clear
```

## 📋 CHECKLIST DE SEGURIDAD

- [ ] ❌ Revocar API key antigua en OpenAI
- [ ] ✅ Generar nueva API key
- [ ] ✅ Actualizar `.env` con nueva key
- [ ] ❌ Limpiar historial de Git
- [ ] ❌ Force push si ya subiste a GitHub
- [ ] ✅ Verificar que `.gitignore` incluye `app.json`
- [ ] ✅ Usar `app.config.js` para desarrollo
- [ ] ❌ Reiniciar servidor Expo

## ⚡ COMANDOS RÁPIDOS

```bash
# 1. Actualizar .env con nueva key
nano .env  # o tu editor favorito

# 2. Limpiar historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch app.json" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (si ya subiste a GitHub)
git push origin --force --all

# 4. Reiniciar Expo
npx expo start --clear
```

## 🔒 ESTADO DESPUÉS DE LA CORRECCIÓN

- ✅ API key antigua revocada (inútil para atacantes)
- ✅ Nueva API key solo en `.env` (ignorado por Git)
- ✅ `app.json` fuera del historial de Git
- ✅ `app.config.js` lee de `.env` de forma segura

## 📞 SOPORTE

Si ya subiste a GitHub:
1. Actúa RÁPIDO - bots escanean keys en minutos
2. Revoca la key ANTES de limpiar el historial
3. Verifica facturación en OpenAI por uso no autorizado

---

**¿Ya subiste este repo a GitHub?** → Actúa AHORA
**¿Solo local?** → Regenera la key y limpia el historial antes de subir
