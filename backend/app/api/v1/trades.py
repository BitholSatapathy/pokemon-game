from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.user_card import UserCard
from app.models.trade import TradeOffer, TradeOfferItem, TradeStatus, TradeSide
from app.schemas.trade import (
    CreateTradeOfferIn,
    TradeOfferOut,
    PlayerSearchOut,
)

router = APIRouter()


def _check_expired(offer: TradeOffer, db: Session) -> bool:
    """Mark offer as EXPIRED if past expires_at. Returns True if expired."""
    now = datetime.now(timezone.utc)
    exp = offer.expires_at
    # Handle naive datetimes stored in SQLite
    if exp.tzinfo is None:
        from datetime import timezone as tz
        exp = exp.replace(tzinfo=tz.utc)
    if offer.status == TradeStatus.PENDING and now > exp:
        offer.status = TradeStatus.EXPIRED
        db.commit()
        return True
    return False


# ---------------------------------------------------------------------------
# POST /trades/offers  — Create a trade offer
# ---------------------------------------------------------------------------
@router.post("/offers", response_model=TradeOfferOut, status_code=201)
def create_trade_offer(
    payload: CreateTradeOfferIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.offer_items and not payload.request_items:
        raise HTTPException(400, "Trade must include at least one offered or requested card")

    # Resolve receiver
    receiver = db.query(User).filter(User.username == payload.receiver_username).first()
    if not receiver:
        raise HTTPException(404, f"Player '{payload.receiver_username}' not found")
    if receiver.id == current_user.id:
        raise HTTPException(400, "Cannot trade with yourself")

    # Verify sender owns all offer cards
    for item in payload.offer_items:
        uc = db.query(UserCard).filter(
            UserCard.id == item.user_card_id,
            UserCard.user_id == current_user.id,
        ).first()
        if not uc:
            raise HTTPException(400, f"You do not own user_card_id={item.user_card_id}")
        if uc.quantity < item.quantity:
            raise HTTPException(
                400,
                f"Insufficient quantity for card {item.user_card_id}: "
                f"have {uc.quantity}, need {item.quantity}",
            )

    # Verify receiver owns all request cards
    for item in payload.request_items:
        uc = db.query(UserCard).filter(
            UserCard.id == item.user_card_id,
            UserCard.user_id == receiver.id,
        ).first()
        if not uc:
            raise HTTPException(
                400,
                f"Receiver does not own user_card_id={item.user_card_id}",
            )
        if uc.quantity < item.quantity:
            raise HTTPException(
                400,
                f"Receiver has insufficient quantity for card {item.user_card_id}",
            )

    # Create the offer
    offer = TradeOffer(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        message=payload.message,
    )
    db.add(offer)
    db.flush()  # get offer.id

    # Add items with card snapshots
    for item in payload.offer_items:
        uc = db.query(UserCard).filter(UserCard.id == item.user_card_id).first()
        card_name = uc.card.name if uc and uc.card else None
        card_image = uc.card.image_url if uc and uc.card else None
        db.add(TradeOfferItem(
            trade_id=offer.id,
            side=TradeSide.OFFER,
            user_card_id=item.user_card_id,
            card_name=card_name,
            card_image=card_image,
            quantity=item.quantity,
        ))

    for item in payload.request_items:
        uc = db.query(UserCard).filter(UserCard.id == item.user_card_id).first()
        card_name = uc.card.name if uc and uc.card else None
        card_image = uc.card.image_url if uc and uc.card else None
        db.add(TradeOfferItem(
            trade_id=offer.id,
            side=TradeSide.REQUEST,
            user_card_id=item.user_card_id,
            card_name=card_name,
            card_image=card_image,
            quantity=item.quantity,
        ))

    db.commit()
    db.refresh(offer)
    return offer


# ---------------------------------------------------------------------------
# GET /trades/offers/received  — Incoming offers
# ---------------------------------------------------------------------------
@router.get("/offers/received", response_model=List[TradeOfferOut])
def get_received_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offers = (
        db.query(TradeOffer)
        .filter(TradeOffer.receiver_id == current_user.id)
        .order_by(TradeOffer.created_at.desc())
        .all()
    )
    for o in offers:
        _check_expired(o, db)
    return offers


# ---------------------------------------------------------------------------
# GET /trades/offers/sent  — Sent offers
# ---------------------------------------------------------------------------
@router.get("/offers/sent", response_model=List[TradeOfferOut])
def get_sent_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offers = (
        db.query(TradeOffer)
        .filter(TradeOffer.sender_id == current_user.id)
        .order_by(TradeOffer.created_at.desc())
        .all()
    )
    for o in offers:
        _check_expired(o, db)
    return offers


# ---------------------------------------------------------------------------
# POST /trades/offers/{offer_id}/accept  — Atomic card swap
# ---------------------------------------------------------------------------
@router.post("/offers/{offer_id}/accept", response_model=TradeOfferOut)
def accept_trade_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offer = db.query(TradeOffer).filter(TradeOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(404, "Trade offer not found")
    if offer.receiver_id != current_user.id:
        raise HTTPException(403, "Only the receiver can accept this offer")
    if offer.status != TradeStatus.PENDING:
        raise HTTPException(400, f"Offer is {offer.status}, not PENDING")
    if _check_expired(offer, db):
        raise HTTPException(400, "Offer has expired")

    offer_items = [i for i in offer.items if i.side == TradeSide.OFFER]
    request_items = [i for i in offer.items if i.side == TradeSide.REQUEST]

    # Re-validate ownership before swapping
    for item in offer_items:
        uc = db.query(UserCard).filter(
            UserCard.id == item.user_card_id,
            UserCard.user_id == offer.sender_id,
        ).first()
        if not uc or uc.quantity < item.quantity:
            raise HTTPException(400, "Sender no longer owns the offered cards")

    for item in request_items:
        uc = db.query(UserCard).filter(
            UserCard.id == item.user_card_id,
            UserCard.user_id == offer.receiver_id,
        ).first()
        if not uc or uc.quantity < item.quantity:
            raise HTTPException(400, "You no longer own the requested cards")

    # --- Atomic swap ---
    # Sender's offer cards → receiver
    for item in offer_items:
        sender_uc = db.query(UserCard).filter(UserCard.id == item.user_card_id).first()
        # Reduce sender quantity
        sender_uc.quantity -= item.quantity
        if sender_uc.quantity <= 0:
            db.delete(sender_uc)
        else:
            db.add(sender_uc)

        # Add to receiver
        receiver_uc = db.query(UserCard).filter(
            UserCard.user_id == offer.receiver_id,
            UserCard.card_id == sender_uc.card_id if sender_uc.quantity > 0 else True,
        ).first()
        # Use card_id from item snapshot
        card_id = item.user_card_id  # we need actual card_id
        # Re-fetch to get card_id before possible deletion
        original = db.query(UserCard).filter(UserCard.id == item.user_card_id).first()
        if original:
            actual_card_id = original.card_id
            is_foil = original.is_foil
        else:
            # Already deleted above — we need to track differently
            # Fallback: skip (shouldn't happen with quantity > 0 initially)
            continue

        existing = db.query(UserCard).filter(
            UserCard.user_id == offer.receiver_id,
            UserCard.card_id == actual_card_id,
            UserCard.is_foil == is_foil,
        ).first()
        if existing:
            existing.quantity += item.quantity
        else:
            db.add(UserCard(
                user_id=offer.receiver_id,
                card_id=actual_card_id,
                is_foil=is_foil,
                quantity=item.quantity,
            ))

    # Receiver's requested cards → sender
    for item in request_items:
        receiver_uc = db.query(UserCard).filter(UserCard.id == item.user_card_id).first()
        actual_card_id = receiver_uc.card_id
        is_foil = receiver_uc.is_foil

        receiver_uc.quantity -= item.quantity
        if receiver_uc.quantity <= 0:
            db.delete(receiver_uc)
        else:
            db.add(receiver_uc)

        existing = db.query(UserCard).filter(
            UserCard.user_id == offer.sender_id,
            UserCard.card_id == actual_card_id,
            UserCard.is_foil == is_foil,
        ).first()
        if existing:
            existing.quantity += item.quantity
        else:
            db.add(UserCard(
                user_id=offer.sender_id,
                card_id=actual_card_id,
                is_foil=is_foil,
                quantity=item.quantity,
            ))

    offer.status = TradeStatus.ACCEPTED
    db.commit()
    db.refresh(offer)
    return offer


# ---------------------------------------------------------------------------
# POST /trades/offers/{offer_id}/decline
# ---------------------------------------------------------------------------
@router.post("/offers/{offer_id}/decline", response_model=TradeOfferOut)
def decline_trade_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offer = db.query(TradeOffer).filter(TradeOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(404, "Trade offer not found")
    if offer.receiver_id != current_user.id:
        raise HTTPException(403, "Only the receiver can decline this offer")
    if offer.status != TradeStatus.PENDING:
        raise HTTPException(400, f"Offer is {offer.status}, not PENDING")
    offer.status = TradeStatus.DECLINED
    db.commit()
    db.refresh(offer)
    return offer


# ---------------------------------------------------------------------------
# POST /trades/offers/{offer_id}/cancel  — Sender cancels
# ---------------------------------------------------------------------------
@router.post("/offers/{offer_id}/cancel", response_model=TradeOfferOut)
def cancel_trade_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offer = db.query(TradeOffer).filter(TradeOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(404, "Trade offer not found")
    if offer.sender_id != current_user.id:
        raise HTTPException(403, "Only the sender can cancel this offer")
    if offer.status != TradeStatus.PENDING:
        raise HTTPException(400, f"Offer is {offer.status}, not PENDING")
    offer.status = TradeStatus.CANCELLED
    db.commit()
    db.refresh(offer)
    return offer


# ---------------------------------------------------------------------------
# GET /trades/users/search  — Find players by username prefix
# ---------------------------------------------------------------------------
@router.get("/users/search", response_model=List[PlayerSearchOut])
def search_players(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    players = (
        db.query(User)
        .filter(User.username.ilike(f"%{q}%"), User.id != current_user.id)
        .limit(10)
        .all()
    )
    return players
