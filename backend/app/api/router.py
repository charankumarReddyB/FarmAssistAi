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
from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes.farm import router as farm_router

from app.api.routes.assistant import router as assistant_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(user_router)
api_router.include_router(weather_router)
api_router.include_router(farm_router)
api_router.include_router(reports_router)
api_router.include_router(analysis_router)
api_router.include_router(crop_analysis_router)
api_router.include_router(advisory_router)
api_router.include_router(expert_router)
api_router.include_router(assistant_router)



