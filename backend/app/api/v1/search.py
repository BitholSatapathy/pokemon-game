from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.api.deps import get_optional_current_user
from app.models.user import User
from app.models.card import Card
from app.models.pack import Pack
from app.models.battle import Deck


router = APIRouter(prefix="/search", tags=["Global Autocomplete & Search"])


class SearchSuggestionOut(BaseModel):
    id: str
    title: str
    subtitle: str
    image_url: Optional[str] = None
    category: str  # 'card' | 'pack' | 'user' | 'deck'
    link_to: str
    rarity: Optional[str] = None
    badge_color: Optional[str] = None


@router.get("/suggestions", response_model=List[SearchSuggestionOut])
def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=50, description="Query string for instant matching"),
    category: Optional[str] = Query("all", description="all, cards, users, packs, decks"),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Unified instant auto-complete suggestions endpoint.
    Returns rich suggestions with left-side icon/thumbnail image, title, and metadata.
    """
    search_term = f"%{q.strip()}%"
    results: List[SearchSuggestionOut] = []

    # 1. Search Cards
    if category in ("all", "cards"):
        cards = (
            db.query(Card)
            .filter(
                or_(
                    Card.name.ilike(search_term),
                    Card.number.ilike(search_term),
                    Card.types.ilike(search_term),
                    Card.rarity.ilike(search_term),
                )
            )
            .limit(limit)
            .all()
        )
        for c in cards:
            badge_color = "purple" if "Holo" in c.rarity or "Secret" in c.rarity else "gray"
            results.append(
                SearchSuggestionOut(
                    id=f"card_{c.id}",
                    title=c.name,
                    subtitle=f"{c.rarity} • {c.card_set.name if c.card_set else 'Set'}",
                    image_url=c.image_url,
                    category="card",
                    link_to=f"/collection?search={c.name}",
                    rarity=c.rarity,
                    badge_color=badge_color,
                )
            )

    # 2. Search Packs
    if category in ("all", "packs") and len(results) < limit:
        packs = (
            db.query(Pack)
            .filter(
                or_(
                    Pack.name.ilike(search_term),
                    Pack.description.ilike(search_term),
                )
            )
            .limit(limit - len(results))
            .all()
        )
        for p in packs:
            results.append(
                SearchSuggestionOut(
                    id=f"pack_{p.id}",
                    title=p.name,
                    subtitle=f"Booster Pack • {p.price_coins:,} Coins",
                    image_url=p.cover_image,
                    category="pack",
                    link_to=f"/shop",
                    badge_color="gold",
                )
            )

    # 3. Search Users
    if category in ("all", "users") and len(results) < limit:
        users = (
            db.query(User)
            .filter(
                or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term),
                )
            )
            .limit(limit - len(results))
            .all()
        )
        for u in users:
            results.append(
                SearchSuggestionOut(
                    id=f"user_{u.id}",
                    title=u.username,
                    subtitle=f"Level {u.level} Trainer • {u.coins:,} Coins",
                    image_url=u.avatar_url,
                    category="user",
                    link_to=f"/profile/{u.username}",
                    badge_color="blue",
                )
            )

    # 4. Search Decks (if logged in)
    if category in ("all", "decks") and current_user and len(results) < limit:
        decks = (
            db.query(Deck)
            .filter(
                Deck.user_id == current_user.id,
                Deck.name.ilike(search_term)
            )
            .limit(limit - len(results))
            .all()
        )
        for d in decks:
            cover_img = d.cover_card.image_url if d.cover_card else None
            results.append(
                SearchSuggestionOut(
                    id=f"deck_{d.id}",
                    title=d.name,
                    subtitle=f"Custom Deck • {'Active' if d.is_active else 'Vaulted'}",
                    image_url=cover_img,
                    category="deck",
                    link_to=f"/decks",
                    badge_color="purple",
                )
            )

    return results[:limit]
