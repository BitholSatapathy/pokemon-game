from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class MysteryShopPurchase(Base):
    __tablename__ = "mystery_shop_purchases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    block_id = Column(Integer, nullable=False, index=True)
    item_id = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
