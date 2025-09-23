"""
Integración principal para CaloriasAPI
Archivo para integrar los nuevos endpoints Stripe con tu aplicación FastAPI existente
"""

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import logging

# Importar los nuevos endpoints
from stripe_endpoints import router as stripe_router
from integration_helper import validate_supabase_token, log_api_usage

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ================== CONFIGURACIÓN DE LA APP ==================

# Si ya tienes una app FastAPI, agregar estas líneas:
# app = FastAPI(title="CaloriasAPI", version="1.0.0")

# Middleware CORS (si no lo tienes ya)
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
"""

# ================== DEPENDENCIAS GLOBALES ==================

async def get_current_user_enhanced(request: Request):
    """
    Dependencia mejorada para obtener usuario actual con validación Supabase
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autorización requerido")

    token = auth_header.replace("Bearer ", "")

    # Validar token con Supabase
    user_data = await validate_supabase_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    return user_data

# ================== MIDDLEWARE DE LOGGING ==================

async def log_request_middleware(request: Request, call_next):
    """
    Middleware para logging de requests
    """
    start_time = time.time()

    # Procesar request
    response = await call_next(request)

    # Log de la request
    duration = time.time() - start_time
    logger.info(f"{request.method} {request.url} - {response.status_code} - {duration:.2f}s")

    return response

# ================== ENDPOINTS DE SALUD MEJORADOS ==================

async def health_check_enhanced():
    """
    Health check mejorado con verificación de servicios
    """
    try:
        # Verificar conexión a Stripe
        stripe_ok = bool(os.getenv("STRIPE_SECRET_KEY"))

        # Verificar conexión a Supabase
        supabase_ok = bool(os.getenv("SUPABASE_URL")) and bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

        # Verificar webhook secret
        webhook_ok = bool(os.getenv("STRIPE_WEBHOOK_SECRET"))

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "stripe_configured": stripe_ok,
                "supabase_configured": supabase_ok,
                "webhook_configured": webhook_ok
            },
            "version": "1.1.0",
            "endpoints_available": [
                "/create-payment-intent",
                "/create-subscription",
                "/cancel-subscription",
                "/update-payment-method",
                "/stripe/webhooks"
            ]
        }

    except Exception as e:
        logger.error(f"❌ Error en health check: {e}")
        raise HTTPException(status_code=500, detail="Error en health check")

# ================== INTEGRACIÓN DE ROUTERS ==================

# Agregar los nuevos endpoints Stripe a tu app existente:
"""
# En tu archivo main.py existente, agregar:
from stripe_endpoints import router as stripe_router

app.include_router(stripe_router, tags=["Stripe"])

# Actualizar el endpoint de health
@app.get("/health")
async def health():
    return await health_check_enhanced()
"""

# ================== CONFIGURACIÓN DE VARIABLES ==================

def validate_environment():
    """
    Validar que todas las variables de entorno requeridas estén configuradas
    """
    required_vars = [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY"
    ]

    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        logger.error(f"❌ Variables de entorno faltantes: {missing_vars}")
        raise Exception(f"Variables de entorno requeridas: {missing_vars}")

    logger.info("✅ Todas las variables de entorno están configuradas")

# ================== INICIALIZACIÓN ==================

def initialize_stripe_integration():
    """
    Inicializar integración Stripe
    """
    try:
        # Validar entorno
        validate_environment()

        # Configurar Stripe
        import stripe
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

        logger.info("✅ Integración Stripe inicializada correctamente")

    except Exception as e:
        logger.error(f"❌ Error inicializando Stripe: {e}")
        raise

# ================== CÓDIGO DE EJEMPLO PARA INTEGRACIÓN ==================

"""
# En tu archivo main.py principal, agregar al inicio:

from stripe_endpoints import router as stripe_router
from integration_helper import validate_supabase_token
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Inicializar Stripe
initialize_stripe_integration()

# Agregar router
app.include_router(stripe_router, tags=["Stripe Subscriptions"])

# Actualizar health check
@app.get("/health")
async def health():
    return await health_check_enhanced()

# Agregar middleware de logging si lo deseas
app.middleware("http")(log_request_middleware)
"""

# ================== TESTING ==================

async def test_stripe_integration():
    """
    Función para probar la integración Stripe
    """
    try:
        import stripe

        # Test básico de conexión
        plans = stripe.Plan.list(limit=1)
        logger.info("✅ Conexión a Stripe exitosa")

        return True

    except Exception as e:
        logger.error(f"❌ Error probando Stripe: {e}")
        return False

if __name__ == "__main__":
    # Para testing directo
    initialize_stripe_integration()
    logger.info("🚀 Integración Stripe lista para usar")