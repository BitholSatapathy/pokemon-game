from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.card import CardResponse

class CreateListingRequest(BaseModel):
    card_id: str
    price_coins: int = Field(..., ge=10, le=1000000)
    is_foil: bool = False
    quantity: int = Field(default=1, ge=1, le=10)

class MarketListingResponse(BaseModel):
    id: int
    seller_id: int
    seller_name: str
    card_id: str
    is_foil: bool
    quantity: int
    price_coins: int
    status: str
    buyer_id: Optional[int] = None
    buyer_name: Optional[str] = None
    created_at: datetime
    sold_at: Optional[datetime] = None
    card: CardResponse

    class Config:
        from_attributes = True

class MarketplaceListingsResponse(BaseModel):
    items: List[MarketListingResponse]
    total: int
    page: int
    limit: int

class BuyListingResponse(BaseModel):
    success: bool
    message: str
    listing_id: int
    card_name: str
    price_coins: int
    new_coin_balance: int

class CancelListingResponse(BaseModel):
    success: bool
    message: str
    listing_id: int
    card_name: str

class MarketplaceStatsResponse(BaseModel):
    active_listings_count: int
    total_volume_24h: int
    top_traded_card: Optional[str] = None
    fee_percentage: float = 5.0
