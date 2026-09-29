import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship

from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    tier = Column(String(20), default="silver")  # bronze, silver, gold
    entry_fee_coins = Column(Integer, default=500)
    reward_coins = Column(Integer, default=5000)
    reward_gems = Column(Integer, default=150)
    reward_pack_id = Column(String(50), nullable=True)
    banner_url = Column(String(255), nullable=True)
    status = Column(String(20), default="active")  # active, completed
    rounds_total = Column(Integer, default=3)  # 8 participants -> 3 rounds (QF, SF, Finals)
    current_round = Column(Integer, default=1)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    participants = relationship("TournamentParticipant", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("TournamentMatch", back_populates="tournament", cascade="all, delete-orphan")
    winner = relationship("User", foreign_keys=[winner_id])


class TournamentParticipant(Base):
    __tablename__ = "tournament_participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_id = Column(String(50), ForeignKey("tournaments.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null if purely AI rival
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    seed = Column(Integer, default=1)
    is_ai = Column(Boolean, default=True)
    active_deck_name = Column(String(100), default="Championship Deck")
    deck_archetype = Column(String(50), default="Fire/Psychic")
    eliminated = Column(Boolean, default=False)
    eliminated_in_round = Column(Integer, nullable=True)

    tournament = relationship("Tournament", back_populates="participants")
    user = relationship("User")


class TournamentMatch(Base):
    __tablename__ = "tournament_matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_id = Column(String(50), ForeignKey("tournaments.id"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)  # 1: QF, 2: SF, 3: Finals
    match_index = Column(Integer, nullable=False)  # 0..3 for QF, 0..1 for SF, 0 for Finals
    participant1_id = Column(Integer, ForeignKey("tournament_participants.id"), nullable=True)
    participant2_id = Column(Integer, ForeignKey("tournament_participants.id"), nullable=True)
    winner_id = Column(Integer, ForeignKey("tournament_participants.id"), nullable=True)
    p1_score = Column(Integer, default=0)
    p2_score = Column(Integer, default=0)
    battle_log = Column(Text, default="[]")  # JSON string of battle turns
    status = Column(String(20), default="pending")  # pending, ready, completed
    completed_at = Column(DateTime, nullable=True)

    tournament = relationship("Tournament", back_populates="matches")
    p1 = relationship("TournamentParticipant", foreign_keys=[participant1_id])
    p2 = relationship("TournamentParticipant", foreign_keys=[participant2_id])
    winner = relationship("TournamentParticipant", foreign_keys=[winner_id])


class BattlePassSeason(Base):
    __tablename__ = "battle_pass_seasons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    season_number = Column(Integer, unique=True, nullable=False)
    title = Column(String(100), nullable=False)
    theme = Column(String(100), default="Kanto Origins")
    description = Column(String(255), nullable=True)
    start_date = Column(DateTime, default=utc_now)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    total_tiers = Column(Integer, default=30)
    xp_per_tier = Column(Integer, default=1000)
    premium_price_gems = Column(Integer, default=500)

    rewards = relationship("BattlePassReward", back_populates="season", cascade="all, delete-orphan")


class BattlePassReward(Base):
    __tablename__ = "battle_pass_rewards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    season_id = Column(Integer, ForeignKey("battle_pass_seasons.id"), nullable=False, index=True)
    tier = Column(Integer, nullable=False)  # 1..30
    is_premium = Column(Boolean, default=False)
    reward_type = Column(String(30), nullable=False)  # coins, gems, pack, card, cosmetic
    reward_amount = Column(Integer, default=1)
    reference_id = Column(String(50), nullable=True)  # e.g. pack_base_set, or cosmetic_id
    title = Column(String(100), nullable=False)
    icon_url = Column(String(255), nullable=True)

    season = relationship("BattlePassSeason", back_populates="rewards")


class UserBattlePass(Base):
    __tablename__ = "user_battle_passes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    season_id = Column(Integer, ForeignKey("battle_pass_seasons.id"), nullable=False, index=True)
    current_tier = Column(Integer, default=1)
    current_xp = Column(Integer, default=0)
    has_premium = Column(Boolean, default=False)
    claimed_free_tiers = Column(Text, default="[]")  # JSON array of ints e.g. [1, 2]
    claimed_premium_tiers = Column(Text, default="[]")  # JSON array of ints

    user = relationship("User")
    season = relationship("BattlePassSeason")
