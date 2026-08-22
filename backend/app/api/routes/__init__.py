from app.api.routes.health import router as health_router
from app.api.routes.reports import router as reports_router
from app.api.routes.analysis import router as analysis_router
from app.api.routes.advisory import router as advisory_router
from app.api.routes.expert import router as expert_router

__all__ = [
    "health_router",
    "reports_router",
    "analysis_router",
    "advisory_router",
    "expert_router",
]
