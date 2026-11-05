from api.routers.auth import router as auth_router
from api.routers.ml_advanced import router as ml_router
from api.routers.experiments import router as experiments_router

__all__ = [
    "auth_router",
    "ml_router",
    "experiments_router",
]
