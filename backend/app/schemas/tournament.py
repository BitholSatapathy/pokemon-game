from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# TOURNAMENTS
# ---------------------------------------------------------------------------

class TournamentParticipantOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    display_name: str
    avatar_url: Optional[str] = None
    seed: int
    is_ai: bool
    active_deck_name: str
    deck_archetype: str
    eliminated: bool
    eliminated_in_round: Optional[int] = None

    class Config:
        from_attributes = True


class TournamentMatchOut(BaseModel):
    id: int
    round_number: int  # 1: QF, 2: SF, 3: Finals
    match_index: int
    participant1: Optional[TournamentParticipantOut] = None
    participant2: Optional[TournamentParticipantOut] = None
    winner: Optional[TournamentParticipantOut] = None
    p1_score: int
    p2_score: int
    status: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TournamentSpectateMatchOut(TournamentMatchOut):
    battle_log: List[str] = []


class TournamentOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    tier: str
    entry_fee_coins: int
    reward_coins: int
    reward_gems: int
    reward_pack_id: Optional[str] = None
    banner_url: Optional[str] = None
    status: str
    rounds_total: int
    current_round: int
    winner_name: Optional[str] = None
    user_participant_id: Optional[int] = None
    user_status: Optional[str] = None  # not_joined, active, eliminated, champion

    class Config:
        from_attributes = True


class TournamentDetailOut(TournamentOut):
    participants: List[TournamentParticipantOut] = []
    matches: List[TournamentMatchOut] = []


class TournamentJoinIn(BaseModel):
    deck_id: Optional[int] = None


class TournamentPlayMatchIn(BaseModel):
    action: str = "attack"  # "attack", "special", "surrender"


class TournamentMatchResultOut(BaseModel):
    match_id: int
    round_number: int
    won: bool
    is_tournament_over: bool
    is_champion: bool
    coins_awarded: int
    gems_awarded: int
    xp_awarded: int
    pack_awarded: Optional[str] = None
    battle_log: List[str]
    next_match_id: Optional[int] = None


# ---------------------------------------------------------------------------
# BATTLE PASS
# ---------------------------------------------------------------------------

class BattlePassRewardOut(BaseModel):
    id: int
    tier: int
    is_premium: bool
    reward_type: str  # coins, gems, pack, card, cosmetic
    reward_amount: int
    reference_id: Optional[str] = None
    title: str
    icon_url: Optional[str] = None
    is_claimed: bool = False

    class Config:
        from_attributes = True


class BattlePassSeasonOut(BaseModel):
    id: int
    season_number: int
    title: str
    theme: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    is_active: bool
    total_tiers: int
    xp_per_tier: int
    premium_price_gems: int

    # Player progress
    user_tier: int
    user_xp: int
    xp_in_current_tier: int
    has_premium: bool
    free_rewards: List[BattlePassRewardOut] = []
    premium_rewards: List[BattlePassRewardOut] = []

    class Config:
        from_attributes = True


class BattlePassClaimOut(BaseModel):
    tier: int
    is_premium: bool
    reward_title: str
    reward_type: str
    reward_amount: int
    coins_balance: int
    gems_balance: int
    message: str
