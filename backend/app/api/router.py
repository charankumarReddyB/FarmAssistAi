from fastapi import APIRouter
from app.api.routes import (
    health_router,
    reports_router,
    analysis_router,
    advisory_router,
    expert_router,
)
from app.api.routes.user import router as user_router
from app.api.routes.weather import router as weather_router
from app.api.routes.crop_analysis import router as crop_analysis_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(user_router)
api_router.include_router(weather_router)
api_router.include_router(reports_router)
api_router.include_router(analysis_router)
api_router.include_router(crop_analysis_router)
api_router.include_router(advisory_router)
api_router.include_router(expert_router)
