from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, default="My Battle Deck")
    cover_card_id = Column(String(50), ForeignKey("cards.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")
    cover_card = relationship("Card", foreign_keys=[cover_card_id])
    cards = relationship("DeckCard", back_populates="deck", cascade="all, delete-orphan", lazy="joined")


class DeckCard(Base):
    __tablename__ = "deck_cards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"), nullable=False, index=True)
    card_id = Column(String(50), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)

    deck = relationship("Deck", back_populates="cards")
    card = relationship("Card", lazy="joined")


class BattleHistory(Base):
    __tablename__ = "battle_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    gym_id = Column(String(50), nullable=False, index=True)
    gym_leader_name = Column(String(100), nullable=False)
    result = Column(String(20), nullable=False)  # "win" | "loss"
    turns_played = Column(Integer, default=1, nullable=False)
    reward_coins = Column(Integer, default=0, nullable=False)
    reward_xp = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
