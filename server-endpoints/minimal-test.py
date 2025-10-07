"""
🧪 Test mínimo para Render - Sin dependencias externas
Solo para verificar que Python y FastAPI funcionan
"""

import os
from fastapi import FastAPI
import uvicorn

# Crear aplicación mínima
app = FastAPI(title="RecipeTuner Minimal Test")

@app.get("/")
async def root():
    """Test básico"""
    return {
        "message": "🍳 RecipeTuner Minimal Test",
        "status": "working",
        "python_version": "OK",
        "fastapi": "OK",
        "port": os.getenv("PORT", "8000"),
        "env_vars": {
            "STRIPE_SECRET_KEY": "present" if os.getenv("STRIPE_SECRET_KEY") else "missing",
            "OPENAI_API_KEY": "present" if os.getenv("OPENAI_API_KEY") else "missing",
            "SUPABASE_URL": "present" if os.getenv("SUPABASE_URL") else "missing",
            "SUPABASE_SERVICE_ROLE_KEY": "present" if os.getenv("SUPABASE_SERVICE_ROLE_KEY") else "missing",
        }
    }

@app.get("/health")
async def health():
    """Health check mínimo"""
    return {"status": "healthy", "test": "minimal"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting minimal test server on port {port}")
    uvicorn.run(
        "minimal-test:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )