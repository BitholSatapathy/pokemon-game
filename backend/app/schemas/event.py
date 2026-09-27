from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class DailyStreakRewardItem(BaseModel):
    day: int
    title: str
    reward_coins: int = 0
    reward_gems: int = 0
    reward_xp: int = 0
    pack_id: Optional[str] = None
    pack_name: Optional[str] = None
    is_claimed: bool = False
    is_today: bool = False
    is_locked: bool = True

class DailyStreakStatusResponse(BaseModel):
    current_streak: int
    longest_streak: int
    total_claims: int
    can_claim_today: bool
    last_claim_date: Optional[str] = None
    seconds_to_reset: int
    calendar: List[DailyStreakRewardItem]

class ClaimDailyStreakResponse(BaseModel):
    success: bool
    message: str
    day_claimed: int
    reward_coins: int
    reward_gems: int
    reward_xp: int
    pack_awarded: Optional[str] = None
    new_coin_balance: int
    new_gem_balance: int
    new_level: int
    new_xp: int
    new_streak: int

class EventBounty(BaseModel):
    id: str
    title: str
    description: str
    target: int
    reward_coins: int
    reward_gems: int
    icon: Optional[str] = None

class GameEventResponse(BaseModel):
    id: str
    name: str
    subtitle: Optional[str] = None
    description: str
    banner_image: str
    badge_text: str
    event_type: str
    buff_xp_multiplier: float
    buff_foil_rate_boost: float
    buff_shop_discount_pct: int
    start_date: datetime
    end_date: datetime
    seconds_remaining: int
    is_active: bool
    bounties: List[Dict[str, Any]] = []

class FlashDealResponse(BaseModel):
    id: int
    deal_date: str
    title: str
    description: str
    pack_id: str
    pack_name: str
    pack_image: str
    original_price: int
    discount_price: int
    discount_pct: int
    bonus_coins: int
    can_purchase: bool
    has_purchased: bool
    seconds_to_reset: int

class PurchaseFlashDealResponse(BaseModel):
    success: bool
    message: str
    pack_name: str
    price_paid: int
    new_coin_balance: int
