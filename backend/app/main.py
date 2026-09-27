import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.api_router import api_router
from app.api.v1 import health
from app.models import User, Series, CardSet, Card, Pack, PlayerPack, Transaction, UserCard, Mission, UserMission
from app.services.missions_service import ensure_default_missions

def seed_default_packs():
    """Seed initial shop booster packs if table is empty."""
    db = SessionLocal()
    try:
        # Check if packs already seeded
        if db.query(Pack).count() == 0:
            default_slots = json.dumps([
                "common", "common", "common", "uncommon", "uncommon",
                "uncommon", "reverse", "reverse", "rare", "special"
            ])
            initial_packs = [
                Pack(
                    id="pack_base_set",
                    name="Base Set Booster",
                    set_id="base1",
                    price_coins=1000,
                    cards_per_pack=10,
                    cover_image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
                    description="The iconic first generation booster pack featuring the classic 102 Base Set cards.",
                    is_featured=True,
                    slots_config=default_slots,
                ),
                Pack(
                    id="pack_jungle",
                    name="Jungle Booster",
                    set_id="base1",
                    price_coins=1200,
                    cards_per_pack=10,
                    cover_image="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600",
                    description="Journey into the untamed wilderness. Uncover Scyther, Eeveelutions, and Snorlax.",
                    is_featured=False,
                    slots_config=default_slots,
                ),
                Pack(
                    id="pack_fossil",
                    name="Fossil Booster",
                    set_id="base1",
                    price_coins=1500,
                    cards_per_pack=10,
                    cover_image="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600",
                    description="Excavate prehistoric titans including Aerodactyl, Lapras, and Dragonite.",
                    is_featured=False,
                    slots_config=default_slots,
                ),
                Pack(
                    id="pack_team_rocket",
                    name="Team Rocket Special Pack",
                    set_id="base1",
                    price_coins=2500,
                    cards_per_pack=10,
                    cover_image="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
                    description="High-risk, high-reward! Dark Charizard, Dark Blastoise, and secret rare rocket gear.",
                    is_featured=True,
                    slots_config=default_slots,
                ),
            ]
            db.add_all(initial_packs)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize all database tables on startup
    Base.metadata.create_all(bind=engine)
    seed_default_packs()
    db = SessionLocal()
    try:
        ensure_default_missions(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for TCG Collector game engine",
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Direct /api/health and /health endpoints as requested in Phase 0 spec
@app.get("/api/health", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    return health.get_health()

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": "/api/health"
    }
