import time
import random
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.card import Card
from app.models.pack import Pack, PlayerPack, Transaction
from app.models.user_card import UserCard
from app.models.admin import GameMasterSetting
from app.models.mystery_shop import MysteryShopPurchase


FOUR_HOURS_SECONDS = 14400  # 4 hours


def get_current_block_info(db: Session) -> (int, int):
    """Calculates the current 4-hour cycle block ID and seconds remaining until next reroll."""
    setting = db.query(GameMasterSetting).filter(GameMasterSetting.key == "mystery_shop_epoch").first()
    offset = int(setting.value) if setting else 0
    now_ts = int(time.time()) + offset
    block_id = now_ts // FOUR_HOURS_SECONDS
    seconds_remaining = FOUR_HOURS_SECONDS - (now_ts % FOUR_HOURS_SECONDS)
    return block_id, max(1, seconds_remaining)


def get_user_mystery_shop(user: User, db: Session) -> Dict[str, Any]:
    """
    Generate or retrieve the user's personal 4-hour rotating mystery black market.
    Guarantees user-unique stock with limited quantities and special discounts.
    """
    block_id, seconds_remaining = get_current_block_info(db)

    # Deterministic RNG keyed by user and current 4h block
    rng = random.Random(f"mystery_{user.id}_{block_id}")

    # Query available cards and packs pool
    all_cards = db.query(Card).all()
    all_packs = db.query(Pack).all()

    if not all_cards or not all_packs:
        return {"items": [], "seconds_remaining": seconds_remaining, "block_id": block_id}

    # Query quantities already purchased by this user in this block
    purchases = (
        db.query(MysteryShopPurchase.item_id, func.sum(MysteryShopPurchase.quantity).label("total_bought"))
        .filter(
            MysteryShopPurchase.user_id == user.id,
            MysteryShopPurchase.block_id == block_id
        )
        .group_by(MysteryShopPurchase.item_id)
        .all()
    )
    purchased_map = {p[0]: p[1] for p in purchases}

    items = []

    # 1. Select 4-5 random cards
    card_count = min(5, len(all_cards))
    chosen_cards = rng.sample(all_cards, card_count)

    for idx, c in enumerate(chosen_cards):
        item_id = f"mcard_{c.id}_{idx}"
        discount = rng.choice([15, 20, 25, 30, 40])
        discounted_price = max(100, int(c.market_price * (100 - discount) / 100))
        max_qty = 1 if "Holo" in c.rarity or "Secret" in c.rarity else 2
        bought = purchased_map.get(item_id, 0)
        qty_left = max(0, max_qty - bought)

        items.append({
            "id": item_id,
            "item_type": "card",
            "reference_id": c.id,
            "name": c.name,
            "subtitle": f"{c.rarity} • {c.card_set.name if c.card_set else 'Special'}",
            "image_url": c.image_url,
            "rarity": c.rarity,
            "types": c.types or "Normal",
            "hp": c.hp,
            "original_price": c.market_price,
            "discount_percent": discount,
            "price_coins": discounted_price,
            "currency": "coins",
            "max_quantity": max_qty,
            "quantity_remaining": qty_left,
            "is_sold_out": qty_left <= 0,
        })

    # 2. Select 2-3 random booster packs
    pack_count = min(3, len(all_packs))
    chosen_packs = rng.sample(all_packs, pack_count)

    for idx, p in enumerate(chosen_packs):
        item_id = f"mpack_{p.id}_{idx}"
        discount = rng.choice([10, 15, 20, 25])
        discounted_price = max(500, int(p.price_coins * (100 - discount) / 100))
        max_qty = 2 if "Mythic" in p.name or "Apex" in p.name else 3
        bought = purchased_map.get(item_id, 0)
        qty_left = max(0, max_qty - bought)

        items.append({
            "id": item_id,
            "item_type": "pack",
            "reference_id": p.id,
            "name": p.name,
            "subtitle": f"Booster Pack • {p.cards_per_pack} Cards",
            "image_url": p.cover_image,
            "rarity": "Booster Pack",
            "types": "Special",
            "hp": None,
            "original_price": p.price_coins,
            "discount_percent": discount,
            "price_coins": discounted_price,
            "currency": "coins",
            "max_quantity": max_qty,
            "quantity_remaining": qty_left,
            "is_sold_out": qty_left <= 0,
        })

    return {
        "items": items,
        "seconds_remaining": seconds_remaining,
        "block_id": block_id,
        "reroll_interval_hours": 4,
    }


def purchase_mystery_item(user: User, item_id: str, quantity: int, db: Session) -> Dict[str, Any]:
    """Purchase limited stock item from user's current 4h mystery shop."""
    if quantity < 1:
        raise ValueError("Quantity must be at least 1.")

    shop_data = get_user_mystery_shop(user, db)
    item = next((it for it in shop_data["items"] if it["id"] == item_id), None)
    if not item:
        raise ValueError("Item not found in current rotating black market stock.")

    if item["quantity_remaining"] < quantity:
        raise ValueError(f"Sold out or limited stock! Only {item['quantity_remaining']} left in this 4-hour cycle.")

    total_cost = item["price_coins"] * quantity
    if user.coins < total_cost:
        raise ValueError(f"Insufficient Coins. Need {total_cost:,} Coins, but you have {user.coins:,} Coins.")

    # Deduct coins
    user.coins -= total_cost

    # Deliver item
    if item["item_type"] == "card":
        card_obj = db.query(Card).filter(Card.id == item["reference_id"]).first()
        if not card_obj:
            raise ValueError("Card data missing.")

        user_card = (
            db.query(UserCard)
            .filter(UserCard.user_id == user.id, UserCard.card_id == card_obj.id, UserCard.is_foil == False)
            .first()
        )
        if user_card:
            user_card.quantity += quantity
        else:
            user_card = UserCard(user_id=user.id, card_id=card_obj.id, quantity=quantity, is_foil=False)
            db.add(user_card)

    elif item["item_type"] == "pack":
        pack_obj = db.query(Pack).filter(Pack.id == item["reference_id"]).first()
        if not pack_obj:
            raise ValueError("Pack data missing.")

        player_pack = (
            db.query(PlayerPack)
            .filter(PlayerPack.user_id == user.id, PlayerPack.pack_id == pack_obj.id)
            .first()
        )
        if player_pack:
            player_pack.quantity += quantity
        else:
            player_pack = PlayerPack(user_id=user.id, pack_id=pack_obj.id, quantity=quantity)
            db.add(player_pack)

    # Record purchase tracking
    record = MysteryShopPurchase(
        user_id=user.id,
        block_id=shop_data["block_id"],
        item_id=item_id,
        quantity=quantity
    )
    db.add(record)

    # Record audit transaction
    tx = Transaction(
        user_id=user.id,
        type="MYSTERY_SHOP_BUY",
        amount=-total_cost,
        currency="coins",
        reference_id=item_id,
        description=f"Purchased {quantity}x {item['name']} from Mystery Black Market"
    )
    db.add(tx)

    db.commit()
    db.refresh(user)

    remaining_after = item["quantity_remaining"] - quantity
    return {
        "success": True,
        "message": f"Successfully purchased {quantity}x {item['name']} for {total_cost:,} Coins!",
        "new_coins": user.coins,
        "item_id": item_id,
        "quantity_remaining": remaining_after,
        "is_sold_out": remaining_after <= 0,
    }


def force_reroll_all_mystery_shops(db: Session) -> int:
    """Admin command: Advances mystery shop epoch by 4 hours to immediately reroll all player shops."""
    setting = db.query(GameMasterSetting).filter(GameMasterSetting.key == "mystery_shop_epoch").first()
    new_offset = (int(setting.value) if setting else 0) + FOUR_HOURS_SECONDS
    if setting:
        setting.value = str(new_offset)
    else:
        setting = GameMasterSetting(
            key="mystery_shop_epoch",
            value=str(new_offset),
            description="Epoch offset for mystery black market 4-hour cycle"
        )
        db.add(setting)
    db.commit()
    return new_offset
