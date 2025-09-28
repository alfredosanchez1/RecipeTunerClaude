"""
Cliente Supabase inicializado de forma segura para Render
"""

import os
from supabase import create_client, Client
from typing import Optional

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Obtener cliente Supabase con inicialización lazy y manejo de errores
    """
    global _supabase_client

    if _supabase_client is None:
        # Obtener variables de entorno
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        # Validar que las variables existan
        if not supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")

        if not supabase_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")

        try:
            # Crear cliente con configuración específica para Render
            _supabase_client = create_client(
                supabase_url,
                supabase_key,
                options={
                    "auto_refresh_token": False,
                    "persist_session": False,
                }
            )
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Supabase client: {str(e)}")

    return _supabase_client