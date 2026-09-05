"""
FarmAssist AI — Backend Entrypoint for Vercel Services
Re-exports FastAPI application instance.
"""
import sys
import traceback

try:
    from app.main import app
except Exception as e:
    from fastapi import FastAPI
    app = FastAPI()
    
    error_msg = traceback.format_exc()
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    def catch_all():
        return {"error": "Startup Crash", "traceback": error_msg}
