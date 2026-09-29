import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.api_router import api_router
from app.api.v1 import health
from app.models import (
    User, Series, CardSet, Card, Pack, PlayerPack, Transaction,
    UserCard, Mission, UserMission, MarketListing,
    UserStreak, GameEvent, FlashDeal, UserFlashDealPurchase,
    TradeOffer, TradeOfferItem, Follow,
    CosmeticItem, UserCosmetic, UserEquippedCosmetics,
    PlayerShop, PlayerShopItem, ShopUpvote,
    GradedCard,
    Deck, DeckCard, BattleHistory,
    Tournament, TournamentParticipant, TournamentMatch,
    BattlePassSeason, BattlePassReward, UserBattlePass,
    AuditLog, SystemAnnouncement, GameMasterSetting
)
from app.services.missions_service import ensure_default_missions
from sqlalchemy import text


def migrate_and_seed_admin():
    """Ensure newly introduced admin columns and seed data exist."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        res = db.execute(text("PRAGMA table_info(users)")).fetchall()
        cols = [r[1] for r in res]
        if "is_admin" not in cols:
            db.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0 NOT NULL"))
        if "is_banned" not in cols:
            db.execute(text("ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT 0 NOT NULL"))
        if "ban_reason" not in cols:
            db.execute(text("ALTER TABLE users ADD COLUMN ban_reason VARCHAR(255) NULL"))
        db.commit()

        db.execute(text("UPDATE users SET is_admin = 1 WHERE username IN ('Trainer', 'Bithol')"))
        db.commit()

        if db.query(SystemAnnouncement).count() == 0:
            announcement = SystemAnnouncement(
                title="🏆 Knockout Tournament & Battle Pass Season 1 Live!",
                message="Compete in the 8-Trainer Knockout Arena and level up your Battle Pass to claim rare Holo Charizard!",
                banner_type="event",
                is_active=True
            )
            db.add(announcement)
            db.commit()

        if db.query(GameMasterSetting).filter(GameMasterSetting.key == "xp_multiplier").count() == 0:
            db.add(GameMasterSetting(
                key="xp_multiplier",
                value="1.0",
                description="Global XP multiplier applied to matches and tournaments"
            ))
            db.commit()
    except Exception as e:
        print(f"Admin migration warning: {e}")
        db.rollback()
    finally:
        db.close()


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
                    cover_image="https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/1stcharizard.jpg",
                    description="The iconic first generation booster pack featuring the classic 102 Base Set cards.",
                    is_featured=True,
                    slots_config=default_slots,
                ),
                Pack(
                    id="pack_jungle",
                    name="Jungle Booster",
                    set_id="base2",
                    price_coins=1200,
                    cards_per_pack=10,
                    cover_image="https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/jungle1.jpg",
                    description="Journey into the untamed wilderness. Uncover Scyther, Eeveelutions, and Snorlax.",
                    is_featured=False,
                    slots_config=default_slots,
                ),
                Pack(
                    id="pack_fossil",
                    name="Fossil Booster",
                    set_id="base3",
                    price_coins=1500,
                    cards_per_pack=10,
                    cover_image="https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/fossil1.jpg",
                    description="Excavate prehistoric titans including Aerodactyl, Lapras, and Dragonite.",
                    is_featured=False,
                    slots_config=default_slots,
                ),
                Pack(
                    id="pack_team_rocket",
                    name="Team Rocket Special Pack",
                    set_id="base5",
                    price_coins=2500,
                    cards_per_pack=10,
                    cover_image="https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/teamrocket1.jpg",
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
    migrate_and_seed_admin()
    seed_default_packs()
    db = SessionLocal()
    try:
        ensure_default_missions(db)
        from app.services.card_expander import expand_cards_and_packs
        expand_cards_and_packs(db)
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
