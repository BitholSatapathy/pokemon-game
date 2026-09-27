from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.trade import TradeStatus, TradeSide


# --- Items ---

class TradeItemIn(BaseModel):
    user_card_id: int
    quantity: int = 1


class TradeItemOut(BaseModel):
    id: int
    side: TradeSide
    user_card_id: Optional[int]
    card_name: Optional[str]
    card_image: Optional[str]
    quantity: int

    class Config:
        from_attributes = True


# --- Offer creation ---

class CreateTradeOfferIn(BaseModel):
    receiver_username: str
    message: Optional[str] = None
    offer_items: List[TradeItemIn]    # cards sender is giving
    request_items: List[TradeItemIn]  # cards sender wants back


# --- User info embedded in offer ---

class TradeUserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


# --- Full offer response ---

class TradeOfferOut(BaseModel):
    id: int
    sender: TradeUserOut
    receiver: TradeUserOut
    status: TradeStatus
    message: Optional[str]
    created_at: datetime
    expires_at: datetime
    items: List[TradeItemOut]

    class Config:
        from_attributes = True


# --- Player search ---

class PlayerSearchOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
