"""
🍳 RecipeTuner API Server
Servidor FastAPI independiente para RecipeTuner
Separado de CalorieSnap para mayor estabilidad
"""

import os
import logging
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
import uvicorn

# Configurar logging PRIMERO
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("RecipeTunerAPI")

# Importar nuestros endpoints con manejo de errores
try:
    from stripe_endpoints import router as stripe_router
    stripe_router_available = True
    logger.info("✅ stripe_endpoints importado correctamente")
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
    logger.info("✅ integration_helper importado correctamente")
except ImportError as e:
    logger.error(f"❌ Error importando integration_helper: {e}")
    integration_helper_available = False

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

@app.get("/api/simple-test")
@app.post("/api/simple-test")
async def simple_test():
    """Endpoint de prueba simple sin dependencias"""
    return {
        "success": True,
        "message": "RecipeTuner API funcionando correctamente",
        "timestamp": datetime.now().isoformat(),
        "server_updated": True,
        "version": "1.0.1",
        "environment": {
            "stripe_configured": bool(os.getenv("STRIPE_SECRET_KEY")),
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
            "supabase_configured": bool(os.getenv("SUPABASE_URL")),
            "port": os.getenv("PORT", "8000")
        }
    }

@app.post("/api/test-stripe-simple")
async def test_stripe_simple():
    """Test simple de conexión con Stripe - sin crear Payment Intent"""
    try:
        import stripe

        # Configurar Stripe
        stripe_key = os.getenv("STRIPE_SECRET_KEY")

        if not stripe_key:
            return {
                "success": False,
                "error": "STRIPE_SECRET_KEY not found",
                "message": "Variable de entorno no configurada"
            }

        # Verificar formato de la clave
        if not stripe_key.startswith("sk_"):
            return {
                "success": False,
                "error": "Invalid Stripe key format",
                "message": "La clave debe empezar con 'sk_'"
            }

        stripe.api_key = stripe_key

        # Test simple: obtener info de la cuenta (no crea nada)
        try:
            account = stripe.Account.retrieve()
            return {
                "success": True,
                "message": "Stripe conectado correctamente",
                "account_id": account.id,
                "country": account.country,
                "currency": account.default_currency,
                "test_mode": not stripe_key.startswith("sk_live_")
            }
        except stripe.error.AuthenticationError:
            return {
                "success": False,
                "error": "Authentication failed",
                "message": "Clave de Stripe inválida o expirada"
            }
        except Exception as stripe_error:
            return {
                "success": False,
                "error": f"Stripe error: {str(stripe_error)}",
                "message": "Error específico de Stripe"
            }

    except Exception as e:
        logger.error(f"❌ Error en test de Stripe: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Error interno del servidor"
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

@app.get("/.well-known/apple-app-site-association")
async def apple_app_site_association():
    """Serve apple-app-site-association file for Universal Links"""
    file_path = Path(__file__).parent / ".well-known" / "apple-app-site-association"

    if not file_path.exists():
        logger.error(f"❌ apple-app-site-association file not found at {file_path}")
        raise HTTPException(status_code=404, detail="File not found")

    logger.info(f"✅ Serving apple-app-site-association from {file_path}")
    return FileResponse(
        file_path,
        media_type="application/json",
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    )

@app.get("/reset-password")
async def reset_password_handler(request: Request):
    """
    Handler para Universal Links de reset de contraseña.
    Este endpoint se llama cuando el usuario hace clic en el link de Supabase.
    Redirige a la app móvil con un deep link custom scheme.
    """
    # Obtener todos los query params (code, access_token, type, etc.)
    query_params = dict(request.query_params)

    logger.info(f"🔐 Reset password request recibido con params: {query_params}")

    # Construir URL de deep link para la app
    # Usamos el custom scheme ya que la app ya está abierta en este punto
    deep_link = "recipetuner://reset-password"

    # Agregar query params al deep link
    if query_params:
        query_string = "&".join([f"{k}={v}" for k, v in query_params.items()])
        deep_link = f"{deep_link}?{query_string}"

    logger.info(f"🔗 Redirigiendo a: {deep_link}")

    # Retornar HTML que hace redirect automático al deep link
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirigiendo a RecipeTuner...</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .container {{
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 1rem;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                max-width: 400px;
            }}
            h1 {{ color: #333; margin-bottom: 1rem; }}
            p {{ color: #666; margin-bottom: 1.5rem; }}
            .spinner {{
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }}
            @keyframes spin {{
                0% {{ transform: rotate(0deg); }}
                100% {{ transform: rotate(360deg); }}
            }}
            .manual-link {{
                display: inline-block;
                margin-top: 1rem;
                padding: 0.75rem 1.5rem;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 0.5rem;
                transition: background 0.3s;
            }}
            .manual-link:hover {{
                background: #764ba2;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="spinner"></div>
            <h1>🔐 RecipeTuner</h1>
            <p>Redirigiendo a la aplicación...</p>
            <p style="font-size: 0.875rem; color: #999;">Si no se abre automáticamente:</p>
            <a href="{deep_link}" class="manual-link">Abrir RecipeTuner</a>
        </div>
        <script>
            // Intentar abrir la app inmediatamente
            window.location.href = "{deep_link}";

            // Fallback: si después de 2 segundos no se abrió, mostrar instrucciones
            setTimeout(function() {{
                console.log("App no se abrió automáticamente, usuario debe hacer clic manual");
            }}, 2000);
        </script>
    </body>
    </html>
    """

    return HTMLResponse(content=html_content)

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