from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from app.core.database import get_db
from app.models.user import User
from app.models.card import Card
from app.models.user_card import UserCard
from app.models.pack import Transaction
from app.models.marketplace import MarketListing
from app.schemas.marketplace import (
    CreateListingRequest,
    MarketListingResponse,
    MarketplaceListingsResponse,
    BuyListingResponse,
    CancelListingResponse,
    MarketplaceStatsResponse,
)
from app.schemas.card import CardResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/market", tags=["Player Marketplace"])

def utc_now():
    return datetime.now(timezone.utc)

def map_listing_response(listing: MarketListing) -> MarketListingResponse:
    seller_name = listing.seller.username if listing.seller else "Unknown Trader"
    buyer_name = listing.buyer.username if listing.buyer else None
    return MarketListingResponse(
        id=listing.id,
        seller_id=listing.seller_id,
        seller_name=seller_name,
        card_id=listing.card_id,
        is_foil=listing.is_foil,
        quantity=listing.quantity,
        price_coins=listing.price_coins,
        status=listing.status,
        buyer_id=listing.buyer_id,
        buyer_name=buyer_name,
        created_at=listing.created_at,
        sold_at=listing.sold_at,
        card=CardResponse.model_validate(listing.card),
    )

@router.get("/listings", response_model=MarketplaceListingsResponse)
def get_active_listings(
    search: Optional[str] = Query(None, description="Search card name"),
    rarity: Optional[str] = Query(None, description="Filter by rarity"),
    set_id: Optional[str] = Query(None, description="Filter by set ID"),
    is_foil: Optional[bool] = Query(None, description="Filter foil status"),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    sort_by: str = Query("newest", regex="^(newest|price_asc|price_desc)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Browse active card listings on the player marketplace."""
    query = (
        db.query(MarketListing)
        .options(joinedload(MarketListing.card), joinedload(MarketListing.seller))
        .filter(MarketListing.status == "ACTIVE")
    )

    if search:
        query = query.join(Card, MarketListing.card_id == Card.id).filter(
            Card.name.ilike(f"%{search}%")
        )

    if rarity:
        if not search:
            query = query.join(Card, MarketListing.card_id == Card.id)
        query = query.filter(Card.rarity == rarity)

    if set_id:
        if not search and not rarity:
            query = query.join(Card, MarketListing.card_id == Card.id)
        query = query.filter(Card.set_id == set_id)

    if is_foil is not None:
        query = query.filter(MarketListing.is_foil == is_foil)

    if min_price is not None:
        query = query.filter(MarketListing.price_coins >= min_price)

    if max_price is not None:
        query = query.filter(MarketListing.price_coins <= max_price)

    total = query.count()

    if sort_by == "price_asc":
        query = query.order_by(MarketListing.price_coins.asc())
    elif sort_by == "price_desc":
        query = query.order_by(MarketListing.price_coins.desc())
    else:
        query = query.order_by(MarketListing.created_at.desc())

    offset = (page - 1) * limit
    listings = query.offset(offset).limit(limit).all()

    items = [map_listing_response(l) for l in listings]
    return MarketplaceListingsResponse(items=items, total=total, page=page, limit=limit)

@router.get("/my-listings", response_model=List[MarketListingResponse])
def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all active, sold, and cancelled listings created by the authenticated player."""
    listings = (
        db.query(MarketListing)
        .options(
            joinedload(MarketListing.card),
            joinedload(MarketListing.seller),
            joinedload(MarketListing.buyer)
        )
        .filter(MarketListing.seller_id == current_user.id)
        .order_by(MarketListing.created_at.desc())
        .all()
    )
    return [map_listing_response(l) for l in listings]

@router.post("/listings", response_model=MarketListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    req: CreateListingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List a card from player's vault for sale at custom coin price (atomic escrow)."""
    card = db.query(Card).filter(Card.id == req.card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found.")

    # 1. Verify player owns sufficient copies
    user_card = (
        db.query(UserCard)
        .filter(
            UserCard.user_id == current_user.id,
            UserCard.card_id == req.card_id,
            UserCard.is_foil == req.is_foil
        )
        .first()
    )

    if not user_card or user_card.quantity < req.quantity:
        current_owned = user_card.quantity if user_card else 0
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient copies. You own {current_owned}x of {card.name}."
        )

    try:
        # 2. Escrow: deduct card from collection
        user_card.quantity -= req.quantity
        if user_card.quantity == 0:
            db.delete(user_card)

        # 3. Create active market listing
        listing = MarketListing(
            seller_id=current_user.id,
            card_id=req.card_id,
            is_foil=req.is_foil,
            quantity=req.quantity,
            price_coins=req.price_coins,
            status="ACTIVE",
            created_at=utc_now()
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        listing = (
            db.query(MarketListing)
            .options(joinedload(MarketListing.card), joinedload(MarketListing.seller))
            .filter(MarketListing.id == listing.id)
            .first()
        )

        return map_listing_response(listing)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create listing: {str(e)}"
        )

@router.post("/listings/{listing_id}/buy", response_model=BuyListingResponse)
def buy_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Purchase an active card listing from another player with 5% marketplace fee."""
    listing = (
        db.query(MarketListing)
        .options(
            joinedload(MarketListing.card),
            joinedload(MarketListing.seller)
        )
        .filter(MarketListing.id == listing_id)
        .first()
    )

    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    if listing.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This listing is no longer active.")

    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot purchase your own listing.")

    if current_user.coins < listing.price_coins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient coins. You have {current_user.coins:,} Coins but listing costs {listing.price_coins:,} Coins."
        )

    try:
        # Calculate 5% marketplace fee
        fee = int(listing.price_coins * 0.05)
        seller_payout = listing.price_coins - fee

        # Deduct coins from buyer
        current_user.coins -= listing.price_coins

        # Credit payout to seller
        seller = listing.seller
        seller.coins += seller_payout

        # Transfer card to buyer's vault
        buyer_card = (
            db.query(UserCard)
            .filter(
                UserCard.user_id == current_user.id,
                UserCard.card_id == listing.card_id,
                UserCard.is_foil == listing.is_foil
            )
            .first()
        )

        if buyer_card:
            buyer_card.quantity += listing.quantity
        else:
            buyer_card = UserCard(
                user_id=current_user.id,
                card_id=listing.card_id,
                quantity=listing.quantity,
                is_foil=listing.is_foil
            )
            db.add(buyer_card)

        # Update listing state
        listing.status = "SOLD"
        listing.buyer_id = current_user.id
        listing.sold_at = utc_now()

        # Audit ledger transactions
        tx_buy = Transaction(
            user_id=current_user.id,
            type="MARKETPLACE_BUY",
            amount=-listing.price_coins,
            currency="coins",
            reference_id=str(listing.id),
            description=f"Purchased {listing.card.name} from {seller.username} for {listing.price_coins:,} Coins"
        )
        tx_sell = Transaction(
            user_id=seller.id,
            type="MARKETPLACE_SELL",
            amount=seller_payout,
            currency="coins",
            reference_id=str(listing.id),
            description=f"Sold {listing.card.name} to {current_user.username} for {seller_payout:,} Coins (5% fee deducted)"
        )
        db.add(tx_buy)
        db.add(tx_sell)

        db.commit()
        db.refresh(current_user)

        return BuyListingResponse(
            success=True,
            message=f"Successfully purchased {listing.card.name} for {listing.price_coins:,} Coins!",
            listing_id=listing.id,
            card_name=listing.card.name,
            price_coins=listing.price_coins,
            new_coin_balance=current_user.coins
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Purchase transaction failed: {str(e)}"
        )

@router.post("/listings/{listing_id}/cancel", response_model=CancelListingResponse)
def cancel_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an active listing and safely return the card to player's vault."""
    listing = (
        db.query(MarketListing)
        .options(joinedload(MarketListing.card))
        .filter(MarketListing.id == listing_id)
        .first()
    )

    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing.")

    if listing.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only active listings can be cancelled.")

    try:
        # Return card to seller's collection
        user_card = (
            db.query(UserCard)
            .filter(
                UserCard.user_id == current_user.id,
                UserCard.card_id == listing.card_id,
                UserCard.is_foil == listing.is_foil
            )
            .first()
        )

        if user_card:
            user_card.quantity += listing.quantity
        else:
            user_card = UserCard(
                user_id=current_user.id,
                card_id=listing.card_id,
                quantity=listing.quantity,
                is_foil=listing.is_foil
            )
            db.add(user_card)

        listing.status = "CANCELLED"
        db.commit()

        return CancelListingResponse(
            success=True,
            message=f"Listing cancelled. {listing.card.name} returned to your collection.",
            listing_id=listing.id,
            card_name=listing.card.name
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel listing: {str(e)}"
        )

@router.get("/stats", response_model=MarketplaceStatsResponse)
def get_marketplace_stats(db: Session = Depends(get_db)):
    """Retrieve 24h market volume, active listings count, and top traded card."""
    active_count = db.query(func.count(MarketListing.id)).filter(MarketListing.status == "ACTIVE").scalar() or 0

    one_day_ago = utc_now() - timedelta(days=1)
    volume_24h = (
        db.query(func.sum(MarketListing.price_coins))
        .filter(MarketListing.status == "SOLD", MarketListing.sold_at >= one_day_ago)
        .scalar() or 0
    )

    # Top traded card in last 7 days
    seven_days_ago = utc_now() - timedelta(days=7)
    top_card_row = (
        db.query(Card.name, func.count(MarketListing.id).label("trade_count"))
        .join(MarketListing, Card.id == MarketListing.card_id)
        .filter(MarketListing.status == "SOLD", MarketListing.sold_at >= seven_days_ago)
        .group_by(Card.name)
        .order_by(func.count(MarketListing.id).desc())
        .first()
    )
    top_traded_name = top_card_row[0] if top_card_row else "Charizard (Base Set)"

    return MarketplaceStatsResponse(
        active_listings_count=active_count,
        total_volume_24h=int(volume_24h),
        top_traded_card=top_traded_name,
        fee_percentage=5.0
    )
