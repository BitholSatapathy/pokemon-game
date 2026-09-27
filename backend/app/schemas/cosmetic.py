from typing import Optional
from pydantic import BaseModel
from app.models.cosmetic import CosmeticType, CosmeticRarity


class CosmeticItemOut(BaseModel):
    id: str
    name: str
    type: CosmeticType
    rarity: CosmeticRarity
    price_coins: int
    price_gems: int
    preview_url: Optional[str] = None
    asset_data: Optional[str] = None
    description: Optional[str] = None
    is_default: bool
    is_owned: bool = False
    is_equipped: bool = False

    class Config:
        from_attributes = True


class EquippedCosmeticsOut(BaseModel):
    sleeve: Optional[CosmeticItemOut] = None
    binder_theme: Optional[CosmeticItemOut] = None
    playmat: Optional[CosmeticItemOut] = None
    avatar_frame: Optional[CosmeticItemOut] = None
    title: Optional[CosmeticItemOut] = None


class EquipRequest(BaseModel):
    slot: str  # "sleeve", "binder_theme", "playmat", "avatar_frame", "title"
    cosmetic_id: Optional[str] = None  # None to unequip


class BuyCosmeticRequest(BaseModel):
    currency: str = "coins"  # "coins" or "gems"
