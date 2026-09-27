from typing import Optional, List
from pydantic import BaseModel


class LeaderboardEntryOut(BaseModel):
    rank: int
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    value: int
    badge: Optional[str] = None
    level: int


class MyRankOut(BaseModel):
    richest_rank: Optional[int] = None
    richest_value: int = 0
    collectors_rank: Optional[int] = None
    collectors_value: int = 0
    traders_rank: Optional[int] = None
    traders_value: int = 0
    level_rank: Optional[int] = None
    level_value: int = 0
