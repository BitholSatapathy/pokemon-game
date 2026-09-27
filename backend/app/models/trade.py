import enum
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class TradeStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class TradeSide(str, enum.Enum):
    OFFER = "offer"      # cards the sender is giving
    REQUEST = "request"  # cards the sender wants in return


class TradeOffer(Base):
    __tablename__ = "trade_offers"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum(TradeStatus), default=TradeStatus.PENDING, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc) + timedelta(hours=48),
    )

    sender = relationship("User", foreign_keys=[sender_id], backref="sent_trades")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_trades")
    items = relationship("TradeOfferItem", back_populates="trade", cascade="all, delete-orphan")


class TradeOfferItem(Base):
    __tablename__ = "trade_offer_items"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trade_offers.id"), nullable=False)
    side = Column(SAEnum(TradeSide), nullable=False)
    user_card_id = Column(Integer, ForeignKey("user_cards.id"), nullable=True)
    card_name = Column(String, nullable=True)   # snapshot of card name for display
    card_image = Column(String, nullable=True)  # snapshot of image url
    quantity = Column(Integer, default=1)

    trade = relationship("TradeOffer", back_populates="items")
    user_card = relationship("UserCard", foreign_keys=[user_card_id])
