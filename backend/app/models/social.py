from datetime import datetime, timezone
from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    follower = relationship("User", foreign_keys=[follower_id], backref="following_relations")
    following = relationship("User", foreign_keys=[following_id], backref="follower_relations")

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),
    )
