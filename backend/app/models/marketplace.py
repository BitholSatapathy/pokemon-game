from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class MarketListing(Base):
    __tablename__ = "marketplace_listings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    card_id = Column(String(50), ForeignKey("cards.id"), index=True, nullable=False)
    is_foil = Column(Boolean, default=False, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    price_coins = Column(Integer, nullable=False)
    status = Column(String(20), index=True, default="ACTIVE", nullable=False)  # 'ACTIVE', 'SOLD', 'CANCELLED'
    buyer_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    sold_at = Column(DateTime(timezone=True), nullable=True)

    seller = relationship("User", foreign_keys=[seller_id])
    buyer = relationship("User", foreign_keys=[buyer_id])
    card = relationship("Card")
