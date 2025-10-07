# 🔒 Guía de Seguridad para API Keys
**Cómo prevenir filtración accidental de secrets en Git/GitHub**

---

## 📋 **Índice**
- [¿Por qué pasó esto?](#por-qué-pasó-esto)
- [Prevención Automática](#prevención-automática)
- [Mejores Prácticas](#mejores-prácticas)
- [Herramientas de Protección](#herramientas-de-protección)
- [Checklist Pre-Commit](#checklist-pre-commit)
- [¿Qué hacer si pasa otra vez?](#qué-hacer-si-pasa-otra-vez)

---

## 🤔 **¿Por qué pasó esto?**

### **Causa común en desarrollo:**
1. **Hardcodeo accidental**: API keys directamente en el código durante testing
2. **Commit sin revisar**: Subir cambios sin verificar contenido sensible
3. **Falta de automatización**: No tener herramientas que detecten secrets

### **No eres el único - es MUY común:**
- GitHub detecta millones de secrets expuestos al año
- Incluso empresas grandes como Tesla, Uber han tenido incidentes similares
- Es parte normal del aprendizaje en desarrollo

---

## 🛡️ **Prevención Automática**

### **1. Git Hooks - Pre-commit Protection**

Instala `pre-commit` para revisar automáticamente antes de cada commit:

```bash
# Instalar pre-commit
pip install pre-commit

# En tu proyecto, crear .pre-commit-config.yaml
```

**Archivo: `.pre-commit-config.yaml`**
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: trailing-whitespace
      - id: end-of-file-fixer

  # Detectar secrets y API keys
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  # Detectar patrones específicos
  - repo: local
    hooks:
      - id: check-api-keys
        name: Check for API Keys
        entry: bash -c 'grep -r -E "(sk-|pk_|sk_live_|pk_live_|sk_test_|pk_test_)" . --exclude-dir=.git --exclude-dir=node_modules; if [ $? -eq 0 ]; then echo "❌ API keys detected in code!"; exit 1; fi'
        language: system
        pass_filenames: false
```

**Activar pre-commit:**
```bash
pre-commit install
```

### **2. GitHub Actions - Protección en CI/CD**

**Archivo: `.github/workflows/security-check.yml`**
```yaml
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Detect Secrets
        uses: reviewdog/action-detect-secrets@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Check for API Keys
        run: |
          if grep -r -E "(sk-|pk_|sk_live_|pk_live_|sk_test_|pk_test_)" . --exclude-dir=.git --exclude-dir=node_modules; then
            echo "❌ API keys detected!"
            exit 1
          fi
```

---

## 📝 **Mejores Prácticas**

### **✅ SIEMPRE Hacer:**

#### **1. Variables de Entorno**
```javascript
// ✅ CORRECTO
const apiKey = process.env.OPENAI_API_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

// ❌ NUNCA HACER
const apiKey = 'sk-proj-abc123...';
```

#### **2. Archivo .env.example**
```bash
# .env.example (SÍ subir a git)
OPENAI_API_KEY=tu_openai_key_aqui
STRIPE_SECRET_KEY=tu_stripe_secret_key_aqui
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key_aqui
```

#### **3. .gitignore Completo**
```bash
# Variables de entorno
.env
.env.local
.env.production
.env.staging
.env.development

# Archivos de configuración sensibles
config/secrets.json
config/keys.json
*.pem
*.key
*.p12

# Logs que pueden contener secrets
*.log
logs/
```

#### **4. Documentación Clara**
```markdown
## Setup
1. Copia `.env.example` a `.env`
2. Añade tus API keys reales
3. NUNCA commitees el archivo `.env`
```

### **❌ NUNCA Hacer:**

- ❌ Hardcodear API keys en el código
- ❌ Commitear archivos `.env`
- ❌ Poner secrets en comentarios
- ❌ Subir archivos de configuración con secrets
- ❌ Usar API keys en URLs o logs

---

## 🔧 **Herramientas de Protección**

### **1. git-secrets (Recomendado)**
```bash
# Instalar
brew install git-secrets  # macOS
# o
sudo apt-get install git-secrets  # Linux

# Configurar en tu repositorio
git secrets --install
git secrets --register-aws
git secrets --register-azure
git secrets --add 'sk-[a-zA-Z0-9]{32,}'
git secrets --add 'pk_[a-zA-Z0-9]{32,}'
```

### **2. detect-secrets**
```bash
pip install detect-secrets

# Escanear proyecto
detect-secrets scan --all-files --force-use-all-plugins

# Crear baseline
detect-secrets scan --all-files --baseline .secrets.baseline
```

### **3. VS Code Extensions**
- **GitLens**: Muestra historial antes de commit
- **Git Blame**: Ve quién cambió qué líneas
- **Secrets Lens**: Detecta secrets en tiempo real

### **4. Configuración Git Global**
```bash
# Configurar template con hooks
git config --global init.templateDir '~/.git-template'
mkdir -p ~/.git-template/hooks

# Crear hook pre-commit global
cat > ~/.git-template/hooks/pre-commit << 'EOF'
#!/bin/bash
# Hook global para detectar API keys
if grep -r -E "(sk-|pk_|sk_live_|pk_live_)" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null; then
    echo "❌ API keys detected! Use environment variables instead."
    echo "💡 Check: .env file, hardcoded keys, config files"
    exit 1
fi
EOF

chmod +x ~/.git-template/hooks/pre-commit
```

---

## ✅ **Checklist Pre-Commit**

### **Antes de cada `git add`:**
- [ ] ¿Hay API keys hardcodeadas en el código?
- [ ] ¿El archivo `.env` está en `.gitignore`?
- [ ] ¿Hay secrets en comentarios o logs?
- [ ] ¿Usé variables de entorno correctamente?

### **Antes de cada `git commit`:**
- [ ] Revisar `git diff` línea por línea
- [ ] Buscar patrones: `sk-`, `pk_`, `api_key`, `secret`
- [ ] Verificar que no hay archivos de configuración sensibles

### **Comando rápido de verificación:**
```bash
# Buscar posibles secrets antes de commit
git diff --cached | grep -E "(sk-|pk_|api_key|secret|password)" || echo "✅ No secrets detected"
```

---

## 🔍 **Herramientas de Monitoreo**

### **1. GitHub Advanced Security**
- Detecta automáticamente secrets en repos privados
- Envía alertas inmediatas
- Sugiere remediation

### **2. GitGuardian**
- Monitoreo 24/7 de repositorios
- Integración con Slack/Teams
- Dashboard de incidentes

### **3. Notification Scripts**
```javascript
// webhook-monitor.js - Detectar pushes con secrets
const webhook = (payload) => {
  const commits = payload.commits;
  commits.forEach(commit => {
    if (commit.message.includes('key') || commit.added.some(file => file.includes('.env'))) {
      // Enviar alerta
      sendSlackAlert(`🚨 Possible secret in commit: ${commit.id}`);
    }
  });
};
```

---

## 🚨 **¿Qué hacer si pasa otra vez?**

### **Acción Inmediata (0-5 minutos):**
1. **STOP** - No hagas más commits
2. **Rotar keys** inmediatamente:
   - OpenAI: https://platform.openai.com/api-keys
   - Stripe: https://dashboard.stripe.com/apikeys
3. **Remover del código** y usar variables de entorno

### **Limpieza del Repositorio (5-15 minutos):**
```bash
# 1. Limpiar archivos
git rm --cached archivo_con_secrets.js
git commit -m "Remove secrets from repository"

# 2. Si está en múltiples commits, usar BFG
java -jar bfg.jar --replace-text secrets.txt .git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 3. Force push (CUIDADO - solo si es tu repo)
git push --force-with-lease origin main
```

### **Configuración Future-Proof (15-30 minutos):**
1. **Instalar herramientas** de este documento
2. **Configurar hooks** y CI/CD
3. **Educar al equipo** sobre estas prácticas
4. **Crear proceso** de code review

---

## 📚 **Recursos Adicionales**

### **Documentación Oficial:**
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_key)

### **Herramientas:**
- [git-secrets](https://github.com/awslabs/git-secrets)
- [detect-secrets](https://github.com/Yelp/detect-secrets)
- [pre-commit](https://pre-commit.com/)
- [GitGuardian](https://gitguardian.com/)

### **Templates:**
- [.gitignore templates](https://github.com/github/gitignore)
- [Security.md template](https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository)

---

## 🎯 **Resumen Ejecutivo**

### **Lo más importante:**
1. **Nunca hardcodear** API keys en código
2. **Siempre usar** variables de entorno
3. **Instalar git-secrets** o pre-commit hooks
4. **Revisar diffs** antes de commits
5. **Rotar keys** inmediatamente si hay exposición

### **Script de instalación rápida:**
```bash
#!/bin/bash
# Quick security setup
brew install git-secrets
git secrets --install
git secrets --register-aws
git secrets --add 'sk-[a-zA-Z0-9]{32,}'
git secrets --add 'pk_[a-zA-Z0-9]{32,}'
echo "✅ Git secrets protection installed!"
```

### **La regla de oro:**
> **"Si no lo pondrías en un billboard, no lo pongas en el código"**

---

**Fecha:** 2025-01-28
**Versión:** 1.0
**Autor:** RecipeTuner Security Team
**Próxima revisión:** Cada 6 meses o después de incidentes