from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class PlayerShop(Base):
    __tablename__ = "player_shops"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    shop_name = Column(String(100), nullable=False)
    slogan = Column(String(255), nullable=True)
    banner_url = Column(String(255), nullable=True)
    featured_card_id = Column(String(50), ForeignKey("cards.id"), nullable=True)
    likes_count = Column(Integer, default=0, nullable=False)
    visits_count = Column(Integer, default=0, nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    owner = relationship("User", foreign_keys=[user_id])
    featured_card = relationship("Card", foreign_keys=[featured_card_id])
    items = relationship("PlayerShopItem", back_populates="shop", cascade="all, delete-orphan")


class PlayerShopItem(Base):
    __tablename__ = "player_shop_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shop_id = Column(Integer, ForeignKey("player_shops.id"), nullable=False, index=True)
    user_card_id = Column(Integer, ForeignKey("user_cards.id"), nullable=False, index=True)
    price_coins = Column(Integer, nullable=False)
    listed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    shop = relationship("PlayerShop", back_populates="items")
    user_card = relationship("UserCard")


class ShopUpvote(Base):
    __tablename__ = "shop_upvotes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    shop_id = Column(Integer, ForeignKey("player_shops.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "shop_id", name="uq_shop_upvote"),
    )
