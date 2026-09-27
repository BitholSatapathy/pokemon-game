from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class SocialUserBasic(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None
    level: int = 1

    class Config:
        from_attributes = True


class FollowOut(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FollowCountsOut(BaseModel):
    user_id: int
    followers_count: int
    following_count: int
    is_following: bool = False


class ShowcaseCardOut(BaseModel):
    id: int
    card_id: str
    name: str
    image_url: Optional[str] = None
    rarity: str
    is_foil: bool = False
    quantity: int = 1


class PublicProfileOut(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None
    level: int
    xp: int
    created_at: datetime
    coins: int
    total_cards: int
    unique_cards: int
    completed_trades: int
    followers_count: int
    following_count: int
    is_following: bool = False
    top_cards: List[ShowcaseCardOut] = []
