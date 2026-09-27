from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.card import Series, CardSet, Card
from app.schemas.card import CardResponse, CardListResponse, SetResponse, SeriesResponse

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

    # Sort numerically by card number if possible
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
