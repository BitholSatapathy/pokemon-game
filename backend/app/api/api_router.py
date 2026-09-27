from fastapi import APIRouter
from app.api.v1 import (
    health, auth, cards, packs, missions, market, events, 
    trades, leaderboard, social, cosmetics, player_shops, grading,
    decks, battle
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(cards.router)
api_router.include_router(packs.router)
api_router.include_router(missions.router)
api_router.include_router(market.router)
api_router.include_router(events.router, prefix="/events", tags=["Events & Daily Systems"])
api_router.include_router(trades.router, prefix="/trades", tags=["Trading System"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
api_router.include_router(social.router, prefix="/social", tags=["Social"])
api_router.include_router(cosmetics.router, prefix="/cosmetics", tags=["Cosmetics & Customization"])
api_router.include_router(player_shops.router, prefix="/shops", tags=["Player Shops & Kiosks"])
api_router.include_router(grading.router, prefix="/grading", tags=["Card Grading (NGS)"])
api_router.include_router(decks.router, prefix="/decks", tags=["Deck Builder"])
api_router.include_router(battle.router, prefix="/battle", tags=["Battle Arena & Gym Leaders"])



