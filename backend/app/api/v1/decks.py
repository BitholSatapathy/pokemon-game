from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.user_card import UserCard
from app.models.card import Card
from app.models.battle import Deck, DeckCard
from app.schemas.battle import DeckOut, DeckCreateIn, DeckUpdateIn, DeckCardItemOut

router = APIRouter()


def _format_deck_out(deck: Deck) -> DeckOut:
    items: List[DeckCardItemOut] = []
    types_count: Dict[str, int] = {}
    total_hp = 0
    total_cards = 0

    for dc in deck.cards:
        c = dc.card
        if not c:
            continue
        c_type = c.types or "Normal"
        c_hp = c.hp or 50
        
        types_count[c_type] = types_count.get(c_type, 0) + dc.quantity
        total_hp += c_hp * dc.quantity
        total_cards += dc.quantity

        items.append(
            DeckCardItemOut(
                id=dc.id,
                card_id=c.id,
                name=c.name,
                image_url=c.image_url,
                types=c_type,
                hp=c_hp,
                rarity=c.rarity,
                quantity=dc.quantity,
            )
        )

    avg_hp = round(total_hp / total_cards, 1) if total_cards > 0 else 0.0

    return DeckOut(
        id=deck.id,
        user_id=deck.user_id,
        name=deck.name,
        cover_card_id=deck.cover_card_id,
        cover_card_image=deck.cover_card.image_url if deck.cover_card else (items[0].image_url if items else None),
        is_active=deck.is_active,
        card_count=total_cards,
        avg_hp=avg_hp,
        types_distribution=types_count,
        cards=items,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
    )


@router.get("", response_model=List[DeckOut])
def get_user_decks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decks = (
        db.query(Deck)
        .filter(Deck.user_id == current_user.id)
        .order_by(Deck.is_active.desc(), Deck.updated_at.desc())
        .all()
    )
    return [_format_deck_out(d) for d in decks]


@router.post("", response_model=DeckOut, status_code=status.HTTP_201_CREATED)
def create_deck(
    payload: DeckCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check existing decks count
    user_deck_count = db.query(Deck).filter(Deck.user_id == current_user.id).count()
    if user_deck_count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 custom decks allowed")

    # Validate ownership of submitted cards
    if payload.cards:
        for item in payload.cards:
            user_card = (
                db.query(UserCard)
                .filter(UserCard.user_id == current_user.id, UserCard.card_id == item.card_id)
                .first()
            )
            if not user_card or user_card.quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"You do not own enough copies of card {item.card_id}",
                )

    # First deck is set active automatically
    is_active = (user_deck_count == 0)

    deck = Deck(
        user_id=current_user.id,
        name=payload.name.strip(),
        cover_card_id=payload.cover_card_id or (payload.cards[0].card_id if payload.cards else None),
        is_active=is_active,
    )
    db.add(deck)
    db.flush()

    for item in payload.cards:
        db_card = db.query(Card).filter(Card.id == item.card_id).first()
        if db_card:
            dc = DeckCard(deck_id=deck.id, card_id=item.card_id, quantity=item.quantity)
            db.add(dc)

    db.commit()
    db.refresh(deck)
    return _format_deck_out(deck)


@router.get("/{deck_id}", response_model=DeckOut)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return _format_deck_out(deck)


@router.put("/{deck_id}", response_model=DeckOut)
def update_deck(
    deck_id: int,
    payload: DeckUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    if payload.name is not None:
        deck.name = payload.name.strip()

    if payload.cover_card_id is not None:
        deck.cover_card_id = payload.cover_card_id

    if payload.is_active is not None and payload.is_active:
        # Deactivate all other decks
        db.query(Deck).filter(Deck.user_id == current_user.id).update({"is_active": False})
        deck.is_active = True

    if payload.cards is not None:
        # Validate ownership
        for item in payload.cards:
            user_card = (
                db.query(UserCard)
                .filter(UserCard.user_id == current_user.id, UserCard.card_id == item.card_id)
                .first()
            )
            if not user_card or user_card.quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"You do not own enough copies of card {item.card_id}",
                )

        # Clear existing cards and re-add
        db.query(DeckCard).filter(DeckCard.deck_id == deck.id).delete()
        for item in payload.cards:
            dc = DeckCard(deck_id=deck.id, card_id=item.card_id, quantity=item.quantity)
            db.add(dc)

    db.commit()
    db.refresh(deck)
    return _format_deck_out(deck)


@router.delete("/{deck_id}")
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    was_active = deck.is_active
    db.delete(deck)
    db.commit()

    # If it was active, pick another deck to be active
    if was_active:
        next_deck = db.query(Deck).filter(Deck.user_id == current_user.id).first()
        if next_deck:
            next_deck.is_active = True
            db.commit()

    return {"success": True, "message": "Deck deleted successfully"}


@router.post("/{deck_id}/activate", response_model=DeckOut)
def activate_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    db.query(Deck).filter(Deck.user_id == current_user.id).update({"is_active": False})
    deck.is_active = True
    db.commit()
    db.refresh(deck)
    return _format_deck_out(deck)
