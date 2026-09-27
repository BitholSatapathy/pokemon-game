from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User
from app.models.card import Series, CardSet, Card
from app.models.pack import Transaction
from app.models.user_card import UserCard
from app.schemas.card import (
    CardResponse,
    CardListResponse,
    SetResponse,
    SeriesResponse,
    UserCardResponse,
    UserCollectionResponse,
    CardSellRequest,
    CardSellResponse,
    BulkSellResponse,
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

@router.post("/cards/sell-duplicates", response_model=BulkSellResponse)
def sell_all_duplicates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bulk liquidate all duplicate cards (quantity > 1), leaving 1 copy of each card in the player's binder.
    Payout = 70% of market value per sold copy.
    """
    duplicate_cards = (
        db.query(UserCard)
        .options(joinedload(UserCard.card))
        .filter(UserCard.user_id == current_user.id, UserCard.quantity > 1)
        .all()
    )

    if not duplicate_cards:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You do not have any duplicate cards in your collection to sell."
        )

    try:
        total_cards_sold = 0
        total_payout = 0

        for uc in duplicate_cards:
            extra_copies = uc.quantity - 1
            if extra_copies > 0:
                card_price = uc.card.market_price if uc.card else 150
                unit_payout = max(10, int(card_price * 0.70))
                payout = unit_payout * extra_copies

                total_cards_sold += extra_copies
                total_payout += payout
                uc.quantity = 1

        current_user.coins += total_payout

        tx = Transaction(
            user_id=current_user.id,
            type="BULK_CARD_SALE",
            amount=total_payout,
            currency="coins",
            reference_id="bulk_duplicates",
            description=f"Liquidated {total_cards_sold} duplicate cards for {total_payout:,} Coins"
        )
        db.add(tx)

        db.commit()
        db.refresh(current_user)

        return BulkSellResponse(
            success=True,
            message=f"Liquidated {total_cards_sold} duplicate cards for {total_payout:,} Coins!",
            cards_sold=total_cards_sold,
            total_coins_earned=total_payout,
            new_coin_balance=current_user.coins
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sell duplicate cards: {str(e)}"
        )

@router.post("/cards/{card_id}/sell", response_model=CardSellResponse)
def sell_single_card(
    card_id: str,
    sell_req: CardSellRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sell 1 or more copies of a specific card from inventory for 70% of market value.
    """
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Card '{card_id}' not found."
        )

    user_card = (
        db.query(UserCard)
        .filter(
            UserCard.user_id == current_user.id,
            UserCard.card_id == card.id,
            UserCard.is_foil == sell_req.is_foil
        )
        .first()
    )

    if not user_card or user_card.quantity < sell_req.quantity:
        current_qty = user_card.quantity if user_card else 0
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot sell {sell_req.quantity}x copies. You only own {current_qty}x copies of {card.name}."
        )

    try:
        unit_payout = max(10, int(card.market_price * 0.70))
        total_payout = unit_payout * sell_req.quantity

        user_card.quantity -= sell_req.quantity
        remaining_quantity = user_card.quantity
        if user_card.quantity == 0:
            db.delete(user_card)

        current_user.coins += total_payout

        tx = Transaction(
            user_id=current_user.id,
            type="CARD_SALE",
            amount=total_payout,
            currency="coins",
            reference_id=card.id,
            description=f"Sold {sell_req.quantity}x {card.name} for {total_payout:,} Coins"
        )
        db.add(tx)

        db.commit()
        db.refresh(current_user)

        return CardSellResponse(
            success=True,
            message=f"Successfully sold {sell_req.quantity}x {card.name} for {total_payout:,} Coins!",
            card_id=card.id,
            card_name=card.name,
            quantity_sold=sell_req.quantity,
            coins_earned=total_payout,
            new_coin_balance=current_user.coins,
            remaining_card_quantity=remaining_quantity
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sell card: {str(e)}"
        )


