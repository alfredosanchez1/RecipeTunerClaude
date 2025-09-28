"""
🍳 RecipeTuner API Server
Servidor FastAPI independiente para RecipeTuner
Separado de CalorieSnap para mayor estabilidad
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Importar nuestros endpoints
try:
    from stripe_endpoints import router as stripe_router
    stripe_router_available = True
except ImportError as e:
    logger.error(f"❌ Error importando stripe_endpoints: {e}")
    stripe_router_available = False
    stripe_router = None

try:
    from integration_helper import (
        initialize_stripe_integration,
        health_check_enhanced,
        validate_required_env_vars
    )
    integration_helper_available = True
except ImportError as e:
    logger.error(f"❌ Error importando integration_helper: {e}")
    integration_helper_available = False

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("RecipeTunerAPI")

# Crear aplicación FastAPI
app = FastAPI(
    title="RecipeTuner API",
    description="API independiente para RecipeTuner - Análisis y gestión de recetas con IA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8081",
        "https://recipetuner.com",
        "https://www.recipetuner.com",
        "exp://localhost:19000",
        "exp://192.168.*:19000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables de entorno requeridas para RecipeTuner
REQUIRED_ENV_VARS = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "OPENAI_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"  # Solo esta es realmente necesaria para el servidor
]

@app.on_event("startup")
async def startup_event():
    """Inicializar aplicación al arrancar"""
    logger.info("🚀 Iniciando RecipeTuner API Server...")

    if integration_helper_available:
        # Validar variables de entorno
        missing_vars = validate_required_env_vars(REQUIRED_ENV_VARS)
        if missing_vars:
            logger.warning(f"⚠️ Variables de entorno faltantes: {missing_vars}")
            # No fallar en desarrollo

        # Inicializar Stripe
        try:
            initialize_stripe_integration()
            logger.info("✅ Stripe inicializado correctamente")
        except Exception as e:
            logger.warning(f"⚠️ Error inicializando Stripe: {e}")
    else:
        logger.warning("⚠️ Integration helper no disponible - funcionando en modo básico")

    logger.info("✅ RecipeTuner API Server iniciado correctamente")

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "🍳 RecipeTuner API Server",
        "version": "1.0.1",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check mejorado"""
    try:
        if integration_helper_available:
            health_data = health_check_enhanced()
        else:
            health_data = {
                "status": "healthy",
                "service": "RecipeTuner API",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "mode": "basic",
                "integrations": {
                    "stripe": bool(os.getenv("STRIPE_SECRET_KEY")),
                    "supabase": bool(os.getenv("SUPABASE_URL"))
                }
            }
        return JSONResponse(
            status_code=200 if health_data["status"] == "healthy" else 503,
            content=health_data
        )
    except Exception as e:
        logger.error(f"❌ Error en health check: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

# Incluir routers
if stripe_router_available and stripe_router:
    app.include_router(stripe_router, prefix="/api", tags=["Stripe Subscriptions"])
    logger.info("✅ Stripe router incluido")
else:
    logger.warning("⚠️ Stripe router no disponible - funcionando sin endpoints de Stripe")

@app.get("/debug/routes")
async def debug_routes():
    """Debug: Mostrar todas las rutas registradas"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": getattr(route, 'name', 'Unknown')
            })
    return {"registered_routes": routes}

@app.post("/api/simple-test")
async def simple_test():
    """Endpoint de prueba simple sin dependencias"""
    return {
        "success": True,
        "message": "Test endpoint working",
        "timestamp": datetime.now().isoformat(),
        "server_updated": True
    }

@app.post("/api/test-stripe-payment-intent")
async def test_stripe_payment_intent(request: Request):
    """Test endpoint para crear Payment Intent básico sin auth"""
    try:
        import stripe

        # Configurar Stripe
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

        if not stripe.api_key:
            return {
                "success": False,
                "error": "Stripe not configured",
                "message": "STRIPE_SECRET_KEY not found"
            }

        # Obtener datos del request
        try:
            body = await request.json()
            amount = body.get("amount", 499)  # Default $4.99 USD
            currency = body.get("currency", "usd")
        except:
            amount = 499
            currency = "usd"

        # Crear Payment Intent básico
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            metadata={
                "app_name": "recipetuner",
                "test_mode": "true",
                "created_at": datetime.now().isoformat()
            }
        )

        return {
            "success": True,
            "payment_intent_id": payment_intent.id,
            "client_secret": payment_intent.client_secret,
            "amount": payment_intent.amount,
            "currency": payment_intent.currency,
            "status": payment_intent.status,
            "test_mode": True
        }

    except Exception as e:
        logger.error(f"❌ Error creando Payment Intent: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Error interno del servidor"
        }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Manejador global de excepciones"""
    logger.error(f"❌ Error no manejado: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "Ha ocurrido un error interno del servidor",
            "timestamp": datetime.now().isoformat()
        }
    )

# Endpoints específicos de RecipeTuner
@app.get("/api/recipes/analyze")
async def analyze_recipe():
    """Analizar receta con IA (placeholder)"""
    return {"message": "Endpoint de análisis de recetas - Por implementar"}

@app.get("/api/nutrition/calculate")
async def calculate_nutrition():
    """Calcular información nutricional (placeholder)"""
    return {"message": "Endpoint de cálculo nutricional - Por implementar"}

if __name__ == "__main__":
    # Configuración para desarrollo local
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )