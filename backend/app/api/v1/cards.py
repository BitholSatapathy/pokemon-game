from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User
from app.models.card import Series, CardSet, Card
from app.models.user_card import UserCard
from app.schemas.card import (
    CardResponse,
    CardListResponse,
    SetResponse,
    SeriesResponse,
    UserCardResponse,
    UserCollectionResponse,
)
from app.api.deps import get_current_user

router = APIRouter(tags=["Cards & Sets"])

@router.get("/sets", response_model=List[SetResponse])
def get_sets(db: Session = Depends(get_db)):
    """Retrieve all available card sets."""
    sets = db.query(CardSet).all()
    return sets

@router.get("/sets/{set_id}", response_model=SetResponse)
def get_set_by_id(set_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific card set."""
    card_set = db.query(CardSet).filter(CardSet.id == set_id).first()
    if not card_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Set with id '{set_id}' not found."
        )
    return card_set

@router.get("/collection/me", response_model=UserCollectionResponse)
@router.get("/cards/collection/me", response_model=UserCollectionResponse)
def get_my_collection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all cards owned by the authenticated player."""
    user_cards = (
        db.query(UserCard)
        .options(joinedload(UserCard.card))
        .filter(UserCard.user_id == current_user.id)
        .order_by(UserCard.obtained_at.desc())
        .all()
    )

    total_cards = sum(uc.quantity for uc in user_cards)
    unique_cards = len({uc.card_id for uc in user_cards})
    total_set_cards = db.query(Card).count()
    completion_percentage = round((unique_cards / total_set_cards * 100), 1) if total_set_cards > 0 else 0.0
    total_market_value = sum(uc.quantity * (uc.card.market_price if uc.card else 0) for uc in user_cards)

    # Rarity breakdown
    all_cards = db.query(Card).all()
    rarity_totals = {}
    for c in all_cards:
        rarity_totals[c.rarity] = rarity_totals.get(c.rarity, 0) + 1

    owned_unique_ids = {uc.card_id: uc.card.rarity for uc in user_cards if uc.card}
    owned_rarity_counts = {}
    for card_id, rarity in owned_unique_ids.items():
        owned_rarity_counts[rarity] = owned_rarity_counts.get(rarity, 0) + 1

    rarity_breakdown = {}
    for r, total in rarity_totals.items():
        rarity_breakdown[r] = {
            "owned": owned_rarity_counts.get(r, 0),
            "total": total,
            "percentage": round((owned_rarity_counts.get(r, 0) / total * 100), 1) if total > 0 else 0.0
        }

    return UserCollectionResponse(
        total_cards=total_cards,
        unique_cards=unique_cards,
        total_set_cards=total_set_cards,
        completion_percentage=completion_percentage,
        total_market_value=total_market_value,
        rarity_breakdown=rarity_breakdown,
        items=[UserCardResponse.model_validate(uc) for uc in user_cards]
    )


@router.get("/cards", response_model=CardListResponse)
def get_cards(
    set_id: Optional[str] = Query(None, description="Filter by set ID, e.g. 'base1'"),
    rarity: Optional[str] = Query(None, description="Filter by rarity, e.g. 'Rare' or 'Common'"),
    search: Optional[str] = Query(None, description="Search by card name or number"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=250),
    db: Session = Depends(get_db)
):
    """Retrieve cards with optional set, rarity, and name filters."""
    query = db.query(Card)

    if set_id:
        query = query.filter(Card.set_id == set_id)

    if rarity and rarity.lower() != "all":
        query = query.filter(Card.rarity.ilike(f"%{rarity}%"))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Card.name.ilike(search_term),
                Card.number.ilike(search_term)
            )
        )

    total = query.count()
    cards = query.offset(skip).limit(limit).all()

    return CardListResponse(
        total=total,
        items=[CardResponse.model_validate(c) for c in cards]
    )

@router.get("/cards/{card_id}", response_model=CardResponse)
def get_card_by_id(card_id: str, db: Session = Depends(get_db)):
    """Retrieve full details for a specific card."""
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Card with id '{card_id}' not found."
        )
    return CardResponse.model_validate(card)

