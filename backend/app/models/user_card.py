from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserCard(Base):
    __tablename__ = "user_cards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    card_id = Column(String(50), ForeignKey("cards.id"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    is_foil = Column(Boolean, default=False, nullable=False)
    obtained_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User")
    card = relationship("Card")


    __table_args__ = (
        UniqueConstraint("user_id", "card_id", "is_foil", name="uq_user_card_foil"),
    )
