from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class AdminUserOut(BaseModel):
    id: int
    username: str
    email: str
    coins: int
    gems: int
    level: int
    xp: int
    avatar_url: str
    is_admin: bool
    is_banned: bool
    ban_reason: Optional[str] = None
    created_at: datetime
    last_login: datetime
    cards_count: int = 0
    packs_count: int = 0
    decks_count: int = 0

    class Config:
        from_attributes = True


class AdminUserListOut(BaseModel):
    total: int
    page: int
    limit: int
    users: List[AdminUserOut]


class BanUserRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255)


class GrantResourcesRequest(BaseModel):
    coins: Optional[int] = Field(0, ge=0)
    gems: Optional[int] = Field(0, ge=0)
    pack_id: Optional[str] = None
    pack_quantity: Optional[int] = Field(0, ge=0)
    card_id: Optional[str] = None
    is_foil: Optional[bool] = False


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    actor_username: str
    action: str
    severity: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True


class SystemAnnouncementIn(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    message: str = Field(..., min_length=5, max_length=500)
    banner_type: str = Field("info", pattern="^(info|warning|success|event)$")
    is_active: bool = True


class SystemAnnouncementOut(BaseModel):
    id: int
    title: str
    message: str
    banner_type: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AntiCheatFlagOut(BaseModel):
    id: str
    user_id: int
    username: str
    flag_type: str
    severity: str  # CRITICAL, WARNING, INFO
    description: str
    metric_value: str
    recommended_action: str
    timestamp: datetime


class XpMultiplierRequest(BaseModel):
    multiplier: float = Field(..., ge=1.0, le=5.0)


class TelemetryOut(BaseModel):
    total_users: int
    banned_users: int
    admin_users: int
    total_coins: int
    total_gems: int
    total_cards_owned: int
    total_graded_cards: int
    total_packs_opened: int
    active_market_listings: int
    total_market_volume_coins: int
    total_tournaments: int
    xp_multiplier: float
    system_status: str
    server_uptime: str
