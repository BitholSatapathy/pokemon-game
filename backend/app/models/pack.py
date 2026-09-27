from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Pack(Base):
    __tablename__ = "packs"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    set_id = Column(String(50), ForeignKey("sets.id"), nullable=False)
    price_coins = Column(Integer, default=1000, nullable=False)
    cards_per_pack = Column(Integer, default=10, nullable=False)
    cover_image = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    slots_config = Column(Text, nullable=True)  # JSON-encoded array for Phase 5 pack engine

    player_packs = relationship("PlayerPack", back_populates="pack", cascade="all, delete-orphan")


class PlayerPack(Base):
    __tablename__ = "player_packs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    pack_id = Column(String(50), ForeignKey("packs.id"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    obtained_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    pack = relationship("Pack", back_populates="player_packs")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # 'PACK_PURCHASE', 'DAILY_REWARD', 'CARD_SALE'
    amount = Column(Integer, nullable=False)    # Negative for spend, positive for earn
    currency = Column(String(20), default="coins", nullable=False)
    reference_id = Column(String(100), nullable=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
