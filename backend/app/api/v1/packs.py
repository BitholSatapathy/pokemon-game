import random
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.user import User
from app.models.card import Card
from app.models.pack import Pack, PlayerPack, Transaction
from app.models.user_card import UserCard
from app.schemas.pack import (
    PackResponse,
    PlayerPackResponse,
    PurchaseResponse,
    TransactionResponse,
    PulledCardResponse,
    PackOpenResponse,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/packs", tags=["Booster Shop & Inventory"])

@router.get("", response_model=List[PackResponse])
def get_shop_packs(db: Session = Depends(get_db)):
    """Retrieve all available booster packs in the official shop."""
    packs = db.query(Pack).all()
    return packs

@router.get("/inventory/me", response_model=List[PlayerPackResponse])
def get_my_unopened_packs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the current player's unopened booster packs from inventory."""
    player_packs = (
        db.query(PlayerPack)
        .options(joinedload(PlayerPack.pack))
        .filter(PlayerPack.user_id == current_user.id, PlayerPack.quantity > 0)
        .all()
    )
    return player_packs

@router.get("/{pack_id}", response_model=PackResponse)
def get_pack_details(pack_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single booster pack."""
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booster pack '{pack_id}' not found."
        )
    return pack

@router.post("/{pack_id}/purchase", response_model=PurchaseResponse)
def purchase_booster_pack(
    pack_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Purchase a booster pack:
    1. Verify player has sufficient coins.
    2. Deduct coins from user balance.
    3. Add pack to player_packs inventory.
    4. Record immutable transaction in ledger.
    """
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booster pack '{pack_id}' does not exist."
        )

    # 1. Balance verification
    if current_user.coins < pack.price_coins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient coins. You have {current_user.coins:,} Coins, but this pack costs {pack.price_coins:,} Coins."
        )

    try:
        # 2. Deduct coins
        current_user.coins -= pack.price_coins

        # 3. Add to player_packs inventory (increment or create)
        player_pack = (
            db.query(PlayerPack)
            .filter(PlayerPack.user_id == current_user.id, PlayerPack.pack_id == pack.id)
            .first()
        )
        if player_pack:
            player_pack.quantity += 1
        else:
            player_pack = PlayerPack(
                user_id=current_user.id,
                pack_id=pack.id,
                quantity=1
            )
            db.add(player_pack)

        # 4. Immutable transaction record
        tx = Transaction(
            user_id=current_user.id,
            type="PACK_PURCHASE",
            amount=-pack.price_coins,
            currency="coins",
            reference_id=pack.id,
            description=f"Purchased 1x {pack.name}"
        )
        db.add(tx)

        # Atomic commit
        db.commit()
        db.refresh(current_user)
        db.refresh(player_pack)

        return PurchaseResponse(
            success=True,
            message=f"Successfully purchased 1x {pack.name} for {pack.price_coins:,} Coins!",
            pack=PackResponse.model_validate(pack),
            remaining_coins=current_user.coins,
            pack_quantity=player_pack.quantity
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transaction failed: {str(e)}"
        )

@router.post("/{pack_id}/open", response_model=PackOpenResponse)
def open_booster_pack(
    pack_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 5 Pack Opening Engine:
    1. Verify player owns >= 1 unopened pack.
    2. Decrement unopened pack inventory.
    3. Server-side RNG 10-card slot distribution:
       - Slots 1-6: Commons
       - Slots 7-9: Uncommons (with 15% reverse holo chance on slot 9)
       - Slot 10: Guaranteed Rare or Rare Holo (35% Rare Holo / 65% Regular Rare)
    4. Persist newly pulled cards to user_cards collection.
    5. Award +50 XP and handle level progression.
    6. Record audit transaction and return full pack pull summary.
    """
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booster pack '{pack_id}' does not exist."
        )

    # 1. Verify player owns this pack
    player_pack = (
        db.query(PlayerPack)
        .filter(PlayerPack.user_id == current_user.id, PlayerPack.pack_id == pack.id, PlayerPack.quantity > 0)
        .first()
    )
    if not player_pack:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You do not own any unopened packs of '{pack.name}'. Visit the Shop to purchase one!"
        )

    try:
        # 2. Decrement pack count
        player_pack.quantity -= 1

        # 3. Fetch cards for this set (fall back to all cards if set has no cards)
        cards_in_set = db.query(Card).filter(Card.set_id == pack.set_id).all()
        if not cards_in_set:
            cards_in_set = db.query(Card).all()
        
        if not cards_in_set:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No cards found in database for pack opening."
            )

        # Categorize pools by rarity
        commons = [c for c in cards_in_set if c.rarity == "Common"]
        uncommons = [c for c in cards_in_set if c.rarity == "Uncommon"]
        rares = [c for c in cards_in_set if c.rarity == "Rare"]
        holo_rares = [c for c in cards_in_set if c.rarity == "Rare Holo"]

        # Ensure pools are not empty
        if not commons:
            commons = cards_in_set
        if not uncommons:
            uncommons = commons
        if not rares:
            rares = uncommons
        if not holo_rares:
            holo_rares = rares

        # 4. Generate 10-card booster slots
        pulled_selections = []

        # Slots 1-6: Commons
        # Sample 6 distinct commons if possible, or choices if pool < 6
        if len(commons) >= 6:
            pulled_commons = random.sample(commons, 6)
        else:
            pulled_commons = random.choices(commons, k=6)
        for c in pulled_commons:
            pulled_selections.append({"card": c, "is_foil": False})

        # Slots 7-9: Uncommons
        if len(uncommons) >= 3:
            pulled_uncommons = random.sample(uncommons, 3)
        else:
            pulled_uncommons = random.choices(uncommons, k=3)
        
        # Check active event buffs
        from app.models.event import GameEvent
        active_event = db.query(GameEvent).filter(GameEvent.is_active == True, GameEvent.end_date > datetime.utcnow()).first()
        xp_mult = active_event.buff_xp_multiplier if active_event else 1.0
        foil_boost = active_event.buff_foil_rate_boost if active_event else 0.0

        # Slot 9 has 15% (+ event foil boost) chance to be reverse holographic foil!
        reverse_foil_rate = min(0.8, 0.15 + foil_boost)
        for i, c in enumerate(pulled_uncommons):
            slot_is_foil = (i == 2 and random.random() < reverse_foil_rate)
            pulled_selections.append({"card": c, "is_foil": slot_is_foil})

        # Slot 10: High-Tier Rare Slot (35% + event foil boost for Rare Holo, remainder Regular Rare)
        holo_rate = min(0.9, 0.35 + foil_boost)
        roll = random.random()
        if roll < holo_rate and holo_rares:
            selected_rare = random.choice(holo_rares)
            rare_foil = True
        else:
            selected_rare = random.choice(rares)
            rare_foil = False
        pulled_selections.append({"card": selected_rare, "is_foil": rare_foil})

        # 5. Persist to player's collection (`user_cards`)
        pulled_responses: List[PulledCardResponse] = []

        for item in pulled_selections:
            card_obj: Card = item["card"]
            is_foil: bool = item["is_foil"]

            # Query existing ownership
            user_card = (
                db.query(UserCard)
                .filter(
                    UserCard.user_id == current_user.id,
                    UserCard.card_id == card_obj.id,
                    UserCard.is_foil == is_foil
                )
                .first()
            )

            is_new = (user_card is None)

            if user_card:
                user_card.quantity += 1
                total_owned = user_card.quantity
            else:
                user_card = UserCard(
                    user_id=current_user.id,
                    card_id=card_obj.id,
                    quantity=1,
                    is_foil=is_foil
                )
                db.add(user_card)
                total_owned = 1

            pulled_responses.append(
                PulledCardResponse(
                    id=card_obj.id,
                    name=card_obj.name,
                    set_id=card_obj.set_id,
                    number=card_obj.number,
                    rarity=card_obj.rarity,
                    types=card_obj.types,
                    hp=card_obj.hp,
                    image_url=card_obj.image_url,
                    market_price=card_obj.market_price,
                    flavor_text=card_obj.flavor_text,
                    artist=card_obj.artist,
                    is_foil=is_foil,
                    is_new=is_new,
                    total_owned=total_owned
                )
            )

        # 6. Award Progression & XP (+50 XP * event multiplier per pack opened)
        xp_earned = int(50 * xp_mult)
        current_user.xp += xp_earned
        
        # Level up threshold: 200 * current_level
        level_up_threshold = current_user.level * 200
        while current_user.xp >= level_up_threshold:
            current_user.xp -= level_up_threshold
            current_user.level += 1
            # Bonus milestone rewards for leveling up: +500 Coins, +25 Gems
            current_user.coins += 500
            current_user.gems += 25
            level_up_threshold = current_user.level * 200

        # 7. Immutable audit record
        tx = Transaction(
            user_id=current_user.id,
            type="PACK_OPEN",
            amount=0,
            currency="coins",
            reference_id=pack.id,
            description=f"Unsealed 1x {pack.name} ({len(pulled_responses)} cards)"
        )
        db.add(tx)

        # Atomic commit
        db.commit()
        db.refresh(current_user)
        db.refresh(player_pack)

        return PackOpenResponse(
            success=True,
            message=f"Successfully opened 1x {pack.name}!",
            pack_id=pack.id,
            pack_name=pack.name,
            cards=pulled_responses,
            remaining_packs=player_pack.quantity,
            xp_earned=xp_earned,
            player_stats={
                "coins": current_user.coins,
                "gems": current_user.gems,
                "level": current_user.level,
                "xp": current_user.xp
            }
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pack opening failed: {str(e)}"
        )

@router.get("/transactions/me", response_model=List[TransactionResponse])
def get_my_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve transaction history for the authenticated player."""
    txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .limit(50)
        .all()
    )
    return txs

