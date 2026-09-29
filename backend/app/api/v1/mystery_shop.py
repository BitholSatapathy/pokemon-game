from typing import Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.mystery_shop_service import (
    get_user_mystery_shop,
    purchase_mystery_item,
)

router = APIRouter(prefix="/mystery-shop", tags=["4-Hour Rotating Black Market"])


class BuyMysteryItemIn(BaseModel):
    item_id: str
    quantity: int = Field(default=1, ge=1, le=10)


@router.get("/current", response_model=Dict[str, Any])
def get_current_shop(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch the player's personal 4-hour rotating mystery black market stock,
    including limited quantities remaining, special discounts, and time to next reroll.
    """
    return get_user_mystery_shop(current_user, db)


@router.post("/buy", response_model=Dict[str, Any])
def buy_item(
    payload: BuyMysteryItemIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Purchase a limited stock card or booster pack from the current 4-hour mystery shop.
    Enforces per-cycle stock limits.
    """
    try:
        return purchase_mystery_item(current_user, payload.item_id, payload.quantity, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
