from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class FeaturedCardOut(BaseModel):
    id: str
    name: str
    image_url: Optional[str] = None
    rarity: str

    class Config:
        from_attributes = True


class ShopCardItemOut(BaseModel):
    id: int
    user_card_id: int
    card_id: str
    name: str
    image_url: Optional[str] = None
    rarity: str
    is_foil: bool
    price_coins: int
    listed_at: datetime

    class Config:
        from_attributes = True


class PlayerShopOut(BaseModel):
    id: int
    user_id: int
    owner_username: str
    owner_avatar_url: Optional[str] = None
    owner_level: int = 1
    shop_name: str
    slogan: Optional[str] = None
    banner_url: Optional[str] = None
    featured_card: Optional[FeaturedCardOut] = None
    likes_count: int = 0
    visits_count: int = 0
    is_open: bool = True
    item_count: int = 0
    is_liked_by_me: bool = False
    items: List[ShopCardItemOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ShopSetupIn(BaseModel):
    shop_name: str = Field(..., min_length=3, max_length=100)
    slogan: Optional[str] = Field(None, max_length=255)
    banner_url: Optional[str] = Field(None, max_length=255)
    featured_card_id: Optional[str] = None
    is_open: bool = True


class StockCardIn(BaseModel):
    user_card_id: int
    price_coins: int = Field(..., ge=10, le=10000000)
