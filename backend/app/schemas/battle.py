from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DeckCardItemIn(BaseModel):
    card_id: str
    quantity: int = Field(default=1, ge=1, le=4)


class DeckCardItemOut(BaseModel):
    id: int
    card_id: str
    name: str
    image_url: str
    types: Optional[str] = "Normal"
    hp: int = 50
    rarity: str
    quantity: int


class DeckCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    cover_card_id: Optional[str] = None
    cards: List[DeckCardItemIn] = []


class DeckUpdateIn(BaseModel):
    name: Optional[str] = None
    cover_card_id: Optional[str] = None
    cards: Optional[List[DeckCardItemIn]] = None
    is_active: Optional[bool] = None


class DeckOut(BaseModel):
    id: int
    user_id: int
    name: str
    cover_card_id: Optional[str] = None
    cover_card_image: Optional[str] = None
    is_active: bool
    card_count: int
    avg_hp: float
    types_distribution: Dict[str, int]
    cards: List[DeckCardItemOut]
    created_at: datetime
    updated_at: datetime


class GymLeaderOut(BaseModel):
    id: str
    name: str
    title: str
    badge_name: str
    badge_icon: str
    difficulty: str
    avatar_url: str
    recommended_level: int
    element_type: str
    reward_coins: int
    reward_xp: int
    team_preview: List[str]


class BattleCardState(BaseModel):
    card_id: str
    name: str
    image_url: str
    types: str
    max_hp: int
    current_hp: int
    basic_atk_name: str
    basic_atk_dmg: int
    special_atk_name: str
    special_atk_dmg: int
    energy: int


class BattleStartIn(BaseModel):
    gym_id: str
    deck_id: Optional[int] = None


class BattleStateOut(BaseModel):
    battle_id: str
    gym_id: str
    gym_name: str
    badge_name: str
    turn: int
    player_active: BattleCardState
    player_bench: List[BattleCardState]
    opponent_active: BattleCardState
    opponent_bench: List[BattleCardState]
    is_over: bool
    winner: Optional[str] = None  # "player" | "opponent" | None
    reward_coins: int = 0
    reward_xp: int = 0
    logs: List[str] = []


class BattleActionIn(BaseModel):
    action: str  # "attack" | "special" | "charge" | "switch"
    switch_idx: Optional[int] = None


class BattleSimulateIn(BaseModel):
    gym_id: str
    deck_id: Optional[int] = None


class BattleSimulateOut(BaseModel):
    gym_id: str
    gym_leader_name: str
    badge_name: str
    result: str  # "win" | "loss"
    turns: int
    logs: List[str]
    reward_coins: int
    reward_xp: int
    player_cards_used: List[str]
    opponent_cards_used: List[str]


class BattleHistoryOut(BaseModel):
    id: int
    gym_id: str
    gym_leader_name: str
    result: str
    turns_played: int
    reward_coins: int
    reward_xp: int
    created_at: datetime
