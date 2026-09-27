from fastapi import APIRouter
from app.api.v1 import health, auth, cards, packs

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(cards.router)
api_router.include_router(packs.router)
