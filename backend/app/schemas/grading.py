from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class GradedCardOut(BaseModel):
    id: int
    user_card_id: int
    card_id: str
    card_name: str
    set_name: str
    card_number: str
    image_url: Optional[str] = None
    rarity: str
    is_foil: bool
    cert_number: str
    grade: float
    grade_label: str
    sub_centering: float
    sub_corners: float
    sub_edges: float
    sub_surface: float
    service_tier: str
    value_multiplier: float
    graded_price: int
    base_price: int
    graded_at: datetime

    class Config:
        from_attributes = True


class GradingSubmitIn(BaseModel):
    user_card_id: int
    service_tier: str = Field("standard", pattern="^(standard|express)$")


class GradingRateTier(BaseModel):
    id: str
    name: str
    price_coins: int
    description: str
    bonus_luck: float


class GradingRatesOut(BaseModel):
    tiers: List[GradingRateTier]
    grade_tiers: Dict[str, str]
