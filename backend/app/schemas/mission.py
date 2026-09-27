from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class MissionResponse(BaseModel):
    id: str
    category: str
    title: str
    description: str
    target: int
    reward_xp: int
    reward_coins: int
    reward_gems: int
    icon: str
    action_type: str

    class Config:
        from_attributes = True

class UserMissionResponse(BaseModel):
    id: str
    mission_id: str
    category: str
    title: str
    description: str
    target: int
    progress: int
    percent: int
    is_completed: bool
    is_claimed: bool
    reward_xp: int
    reward_coins: int
    reward_gems: int
    icon: str

class MissionsSummaryResponse(BaseModel):
    daily: List[UserMissionResponse]
    weekly: List[UserMissionResponse]
    achievements: List[UserMissionResponse]
    daily_reset_seconds: int
    weekly_reset_seconds: int
    claimable_count: int

class MissionClaimResponse(BaseModel):
    success: bool
    message: str
    mission_id: str
    reward_xp: int
    reward_coins: int
    reward_gems: int
    new_coins: int
    new_gems: int
    new_level: int
    new_xp: int
    leveled_up: bool
    level_up_bonuses: Optional[Dict[str, Any]] = None

class PlayerProgressionResponse(BaseModel):
    level: int
    title: str
    xp: int
    next_level_xp: int
    xp_percentage: int
    coins: int
    gems: int
    total_packs_opened: int
    total_cards_collected: int
