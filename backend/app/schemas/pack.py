from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PackResponse(BaseModel):
    id: str
    name: str
    set_id: str
    price_coins: int
    cards_per_pack: int
    cover_image: str
    description: Optional[str] = None
    is_featured: bool

    class Config:
        from_attributes = True

class PlayerPackResponse(BaseModel):
    id: int
    pack_id: str
    quantity: int
    obtained_at: datetime
    pack: PackResponse

    class Config:
        from_attributes = True

class PurchaseResponse(BaseModel):
    success: bool
    message: str
    pack: PackResponse
    remaining_coins: int
    pack_quantity: int

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    type: str
    amount: int
    currency: str
    reference_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PulledCardResponse(BaseModel):
    id: str
    name: str
    set_id: str
    number: str
    rarity: str
    types: Optional[str] = None
    hp: Optional[int] = None
    image_url: str
    market_price: int
    flavor_text: Optional[str] = None
    artist: Optional[str] = None
    is_foil: bool = False
    is_new: bool = False
    total_owned: int = 1

    class Config:
        from_attributes = True

class PackOpenResponse(BaseModel):
    success: bool
    message: str
    pack_id: str
    pack_name: str
    cards: list[PulledCardResponse]
    remaining_packs: int
    xp_earned: int
    player_stats: dict

