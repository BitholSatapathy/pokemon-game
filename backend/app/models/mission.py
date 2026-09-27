from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String(50), primary_key=True, index=True)
    category = Column(String(20), index=True, nullable=False)  # 'daily', 'weekly', 'achievement'
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    target = Column(Integer, nullable=False, default=1)
    reward_xp = Column(Integer, nullable=False, default=50)
    reward_coins = Column(Integer, nullable=False, default=100)
    reward_gems = Column(Integer, nullable=False, default=0)
    icon = Column(String(50), nullable=False, default="target")
    action_type = Column(String(50), nullable=False)  # 'open_pack', 'buy_pack', 'sell_card', 'collect_unique', 'collect_holo'
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

class UserMission(Base):
    __tablename__ = "user_missions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    mission_id = Column(String(50), ForeignKey("missions.id"), index=True, nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    is_claimed = Column(Boolean, default=False, nullable=False)
    period_key = Column(String(30), index=True, nullable=False)  # e.g. '2026-09-27', '2026-W39', 'lifetime'
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    mission = relationship("Mission")
    user = relationship("User")

    __tableargs__ = (
        UniqueConstraint("user_id", "mission_id", "period_key", name="uix_user_mission_period"),
    )
