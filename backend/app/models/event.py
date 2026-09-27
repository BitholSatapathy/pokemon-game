from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Date, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.core.database import Base

class UserStreak(Base):
    __tablename__ = "user_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    current_streak = Column(Integer, default=0, nullable=False) # 1 to 7
    longest_streak = Column(Integer, default=0, nullable=False)
    last_claim_date = Column(String, nullable=True) # YYYY-MM-DD
    total_claims = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="streak")


class GameEvent(Base):
    __tablename__ = "game_events"

    id = Column(String, primary_key=True, index=True) # e.g. event_celestial_horizons
    name = Column(String, nullable=False)
    subtitle = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    banner_image = Column(String, nullable=False)
    badge_text = Column(String, default="LIVE EVENT", nullable=False)
    event_type = Column(String, default="SEASONAL", nullable=False) # SEASONAL, WEEKEND_BUFF, FLASH
    buff_xp_multiplier = Column(Float, default=1.0, nullable=False)
    buff_foil_rate_boost = Column(Float, default=0.0, nullable=False)
    buff_shop_discount_pct = Column(Integer, default=0, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    bounties = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class FlashDeal(Base):
    __tablename__ = "flash_deals"

    id = Column(Integer, primary_key=True, index=True)
    deal_date = Column(String, index=True, nullable=False) # YYYY-MM-DD
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    pack_id = Column(String, ForeignKey("packs.id"), nullable=False)
    original_price = Column(Integer, nullable=False)
    discount_price = Column(Integer, nullable=False)
    discount_pct = Column(Integer, default=25, nullable=False)
    bonus_coins = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    pack = relationship("Pack")


class UserFlashDealPurchase(Base):
    __tablename__ = "user_flash_deal_purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    deal_id = Column(Integer, ForeignKey("flash_deals.id", ondelete="CASCADE"), nullable=False, index=True)
    purchase_date = Column(String, nullable=False) # YYYY-MM-DD
    purchased_at = Column(DateTime, default=datetime.utcnow, nullable=False)
