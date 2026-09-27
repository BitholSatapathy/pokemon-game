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
    items: List[UserCardResponse]

