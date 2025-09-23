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
from stripe_endpoints import router as stripe_router
from integration_helper import (
    initialize_stripe_integration,
    health_check_enhanced,
    validate_required_env_vars
)

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
    "SUPABASE_ANON_KEY"
]

@app.on_event("startup")
async def startup_event():
    """Inicializar aplicación al arrancar"""
    logger.info("🚀 Iniciando RecipeTuner API Server...")

    # Validar variables de entorno
    missing_vars = validate_required_env_vars(REQUIRED_ENV_VARS)
    if missing_vars:
        logger.error(f"❌ Variables de entorno faltantes: {missing_vars}")
        raise RuntimeError(f"Variables de entorno requeridas: {missing_vars}")

    # Inicializar Stripe
    try:
        initialize_stripe_integration()
        logger.info("✅ Stripe inicializado correctamente")
    except Exception as e:
        logger.error(f"❌ Error inicializando Stripe: {e}")
        raise

    logger.info("✅ RecipeTuner API Server iniciado correctamente")

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "🍳 RecipeTuner API Server",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check mejorado"""
    try:
        health_data = health_check_enhanced()
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
app.include_router(stripe_router, prefix="/api", tags=["Stripe Subscriptions"])

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
