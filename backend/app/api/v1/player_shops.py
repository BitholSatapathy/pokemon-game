from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.card import Card
from app.models.user_card import UserCard
from app.models.pack import Transaction
from app.models.player_shop import PlayerShop, PlayerShopItem, ShopUpvote
from app.schemas.player_shop import (
    PlayerShopOut,
    ShopCardItemOut,
    FeaturedCardOut,
    ShopSetupIn,
    StockCardIn,
)

router = APIRouter()


def _format_shop_out(shop: PlayerShop, current_user_id: Optional[int], db: Session) -> PlayerShopOut:
    owner = shop.owner
    featured = None
    if shop.featured_card:
        featured = FeaturedCardOut(
            id=shop.featured_card.id,
            name=shop.featured_card.name,
            image_url=shop.featured_card.image_url,
            rarity=shop.featured_card.rarity,
        )

    # Format items
    items_out = []
    for it in shop.items:
        if it.user_card and it.user_card.card:
            items_out.append(ShopCardItemOut(
                id=it.id,
                user_card_id=it.user_card_id,
                card_id=it.user_card.card_id,
                name=it.user_card.card.name,
                image_url=it.user_card.card.image_url,
                rarity=it.user_card.card.rarity,
                is_foil=it.user_card.is_foil,
                price_coins=it.price_coins,
                listed_at=it.listed_at,
            ))

    is_liked = False
    if current_user_id:
        is_liked = (
            db.query(ShopUpvote)
            .filter(ShopUpvote.user_id == current_user_id, ShopUpvote.shop_id == shop.id)
            .first()
            is not None
        )

    return PlayerShopOut(
        id=shop.id,
        user_id=shop.user_id,
        owner_username=owner.username if owner else "Unknown",
        owner_avatar_url=owner.avatar_url if owner else None,
        owner_level=owner.level if owner else 1,
        shop_name=shop.shop_name,
        slogan=shop.slogan,
        banner_url=shop.banner_url,
        featured_card=featured,
        likes_count=shop.likes_count,
        visits_count=shop.visits_count,
        is_open=shop.is_open,
        item_count=len(shop.items),
        is_liked_by_me=is_liked,
        items=items_out,
        created_at=shop.created_at,
    )


@router.get("/browse", response_model=List[PlayerShopOut])
def browse_shops(
    sort_by: str = Query("popular", pattern="^(popular|newest|visited)$"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    query = db.query(PlayerShop).filter(PlayerShop.is_open == True)
    if sort_by == "newest":
        query = query.order_by(PlayerShop.created_at.desc())
    elif sort_by == "visited":
        query = query.order_by(PlayerShop.visits_count.desc(), PlayerShop.likes_count.desc())
    else:
        query = query.order_by(PlayerShop.likes_count.desc(), PlayerShop.visits_count.desc())

    shops = query.limit(30).all()
    user_id = current_user.id if current_user else None
    return [_format_shop_out(s, user_id, db) for s in shops]


@router.get("/mine", response_model=Optional[PlayerShopOut])
def get_my_shop(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = db.query(PlayerShop).filter(PlayerShop.user_id == current_user.id).first()
    if not shop:
        return None
    return _format_shop_out(shop, current_user.id, db)


@router.post("/setup", response_model=PlayerShopOut)
def setup_or_update_shop(
    payload: ShopSetupIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate featured card if provided
    if payload.featured_card_id:
        card = db.query(Card).filter(Card.id == payload.featured_card_id).first()
        if not card:
            raise HTTPException(status_code=400, detail="Featured card not found in database")

    shop = db.query(PlayerShop).filter(PlayerShop.user_id == current_user.id).first()
    if not shop:
        shop = PlayerShop(
            user_id=current_user.id,
            shop_name=payload.shop_name,
            slogan=payload.slogan,
            banner_url=payload.banner_url,
            featured_card_id=payload.featured_card_id,
            is_open=payload.is_open,
        )
        db.add(shop)
    else:
        shop.shop_name = payload.shop_name
        shop.slogan = payload.slogan
        shop.banner_url = payload.banner_url
        shop.featured_card_id = payload.featured_card_id
        shop.is_open = payload.is_open

    db.commit()
    db.refresh(shop)
    return _format_shop_out(shop, current_user.id, db)


@router.post("/stock", response_model=ShopCardItemOut)
def stock_card_in_shop(
    payload: StockCardIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = db.query(PlayerShop).filter(PlayerShop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(
            status_code=400,
            detail="You must first set up your shop before stocking cards",
        )

    # Validate ownership
    user_card = (
        db.query(UserCard)
        .filter(UserCard.id == payload.user_card_id, UserCard.user_id == current_user.id)
        .first()
    )
    if not user_card or user_card.quantity < 1:
        raise HTTPException(status_code=400, detail="You do not own this card in your vault")

    # Check already stocked
    already_stocked = (
        db.query(PlayerShopItem)
        .filter(PlayerShopItem.shop_id == shop.id, PlayerShopItem.user_card_id == payload.user_card_id)
        .first()
    )
    if already_stocked:
        raise HTTPException(status_code=400, detail="This card is already stocked in your shop")

    item = PlayerShopItem(
        shop_id=shop.id,
        user_card_id=payload.user_card_id,
        price_coins=payload.price_coins,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return ShopCardItemOut(
        id=item.id,
        user_card_id=item.user_card_id,
        card_id=user_card.card_id,
        name=user_card.card.name if user_card.card else "Card",
        image_url=user_card.card.image_url if user_card.card else None,
        rarity=user_card.card.rarity if user_card.card else "common",
        is_foil=user_card.is_foil,
        price_coins=item.price_coins,
        listed_at=item.listed_at,
    )


@router.delete("/stock/{item_id}")
def unstock_card(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = db.query(PlayerShop).filter(PlayerShop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    item = (
        db.query(PlayerShopItem)
        .filter(PlayerShopItem.id == item_id, PlayerShopItem.shop_id == shop.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Stocked item not found in your shop")

    db.delete(item)
    db.commit()
    return {"detail": "Card unstocked successfully"}


@router.get("/view/{username}", response_model=PlayerShopOut)
def view_player_shop(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    owner = db.query(User).filter(User.username == username).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Player not found")

    shop = db.query(PlayerShop).filter(PlayerShop.user_id == owner.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail=f"Player '{username}' has not set up a shop yet")

    # Increment visit counter
    shop.visits_count += 1
    db.commit()
    db.refresh(shop)

    user_id = current_user.id if current_user else None
    return _format_shop_out(shop, user_id, db)


@router.post("/upvote/{username}")
def toggle_upvote_shop(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    owner = db.query(User).filter(User.username == username).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Player not found")
    if owner.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot upvote your own shop")

    shop = db.query(PlayerShop).filter(PlayerShop.user_id == owner.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    existing = (
        db.query(ShopUpvote)
        .filter(ShopUpvote.user_id == current_user.id, ShopUpvote.shop_id == shop.id)
        .first()
    )

    if existing:
        db.delete(existing)
        shop.likes_count = max(0, shop.likes_count - 1)
        is_liked = False
    else:
        new_upvote = ShopUpvote(user_id=current_user.id, shop_id=shop.id)
        db.add(new_upvote)
        shop.likes_count += 1
        is_liked = True

    db.commit()
    db.refresh(shop)

    return {"likes_count": shop.likes_count, "is_liked": is_liked}


@router.post("/buy/{item_id}")
def buy_from_shop(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(PlayerShopItem).filter(PlayerShopItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no longer available in shop")

    shop = item.shop
    if not shop or not shop.is_open:
        raise HTTPException(status_code=400, detail="This shop is currently closed")

    seller = shop.owner
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    if seller.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot buy cards from your own shop")

    # Check buyer balance
    if current_user.coins < item.price_coins:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient coins: price is {item.price_coins:,}, you have {current_user.coins:,}",
        )

    # Check seller still has the card
    seller_card = (
        db.query(UserCard)
        .filter(UserCard.id == item.user_card_id, UserCard.user_id == seller.id)
        .first()
    )
    if not seller_card or seller_card.quantity < 1:
        db.delete(item)
        db.commit()
        raise HTTPException(status_code=400, detail="Seller no longer owns this card")

    card_name = seller_card.card.name if seller_card.card else "Card"
    card_id = seller_card.card_id
    is_foil = seller_card.is_foil
    price = item.price_coins

    # Economic settlement: 5% protocol fee
    fee = int(price * 0.05)
    seller_payout = price - fee

    current_user.coins -= price
    seller.coins += seller_payout

    # Transfer card
    seller_card.quantity -= 1
    if seller_card.quantity <= 0:
        db.delete(seller_card)

    # Add to buyer
    buyer_card = (
        db.query(UserCard)
        .filter(
            UserCard.user_id == current_user.id,
            UserCard.card_id == card_id,
            UserCard.is_foil == is_foil,
        )
        .first()
    )
    if buyer_card:
        buyer_card.quantity += 1
    else:
        buyer_card = UserCard(
            user_id=current_user.id,
            card_id=card_id,
            quantity=1,
            is_foil=is_foil,
        )
        db.add(buyer_card)

    # Delete item from shop
    db.delete(item)

    # Log financial transactions
    tx_buyer = Transaction(
        user_id=current_user.id,
        type="SHOP_BUY",
        amount=-price,
        currency="coins",
        reference_id=str(item_id),
        description=f"Bought {card_name} from {seller.username}'s shop",
    )
    tx_seller = Transaction(
        user_id=seller.id,
        type="SHOP_SALE",
        amount=seller_payout,
        currency="coins",
        reference_id=str(item_id),
        description=f"Sold {card_name} to {current_user.username} in shop (Fee: {fee:,} Coins)",
    )
    db.add(tx_buyer)
    db.add(tx_seller)

    db.commit()

    return {
        "success": True,
        "card_name": card_name,
        "price_coins": price,
        "seller": seller.username,
        "remaining_coins": current_user.coins,
    }
