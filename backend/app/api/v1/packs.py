from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.user import User
from app.models.pack import Pack, PlayerPack, Transaction
from app.schemas.pack import PackResponse, PlayerPackResponse, PurchaseResponse, TransactionResponse
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
