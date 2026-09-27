from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class CardResponse(BaseModel):
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

    class Config:
        from_attributes = True

class CardListResponse(BaseModel):
    total: int
    items: List[CardResponse]

class SetResponse(BaseModel):
    id: str
    name: str
    series_id: str
    total_cards: int
    logo_url: Optional[str] = None
    symbol_url: Optional[str] = None
    release_date: Optional[str] = None

    class Config:
        from_attributes = True

class SeriesResponse(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    sets: Optional[List[SetResponse]] = None

    class Config:
        from_attributes = True

class UserCardResponse(BaseModel):
    id: int
    card_id: str
    quantity: int
    is_foil: bool
    obtained_at: datetime
    card: CardResponse

    class Config:
        from_attributes = True

class UserCollectionResponse(BaseModel):
    total_cards: int
    unique_cards: int
    total_set_cards: int
    completion_percentage: float
    total_market_value: int = 0
    rarity_breakdown: Optional[dict] = None
    items: List[UserCardResponse]

class CardSellRequest(BaseModel):
    quantity: int = 1
    is_foil: bool = False

class CardSellResponse(BaseModel):
    success: bool
    message: str
    card_id: str
    card_name: str
    quantity_sold: int
    coins_earned: int
    new_coin_balance: int
    remaining_card_quantity: int

class BulkSellResponse(BaseModel):
    success: bool
    message: str
    cards_sold: int
    total_coins_earned: int
    new_coin_balance: int



