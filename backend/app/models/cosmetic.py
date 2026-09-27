import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class CosmeticType(str, enum.Enum):
    SLEEVE = "sleeve"
    BINDER_THEME = "binder_theme"
    PLAYMAT = "playmat"
    AVATAR_FRAME = "avatar_frame"
    TITLE = "title"


class CosmeticRarity(str, enum.Enum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class CosmeticItem(Base):
    __tablename__ = "cosmetic_items"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(SAEnum(CosmeticType), nullable=False, index=True)
    rarity = Column(SAEnum(CosmeticRarity), default=CosmeticRarity.COMMON, nullable=False)
    price_coins = Column(Integer, default=0, nullable=False)
    price_gems = Column(Integer, default=0, nullable=False)
    preview_url = Column(String(255), nullable=True)
    asset_data = Column(String(500), nullable=True)
    description = Column(String(255), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)


class UserCosmetic(Base):
    __tablename__ = "user_cosmetics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    cosmetic_id = Column(String(50), ForeignKey("cosmetic_items.id"), nullable=False, index=True)
    acquired_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User")
    cosmetic = relationship("CosmeticItem")

    __table_args__ = (
        UniqueConstraint("user_id", "cosmetic_id", name="uq_user_cosmetic"),
    )


class UserEquippedCosmetics(Base):
    __tablename__ = "user_equipped_cosmetics"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True, index=True)
    equipped_sleeve_id = Column(String(50), ForeignKey("cosmetic_items.id"), nullable=True)
    equipped_binder_theme_id = Column(String(50), ForeignKey("cosmetic_items.id"), nullable=True)
    equipped_playmat_id = Column(String(50), ForeignKey("cosmetic_items.id"), nullable=True)
    equipped_avatar_frame_id = Column(String(50), ForeignKey("cosmetic_items.id"), nullable=True)
    equipped_title_id = Column(String(50), ForeignKey("cosmetic_items.id"), nullable=True)

    user = relationship("User")
    sleeve = relationship("CosmeticItem", foreign_keys=[equipped_sleeve_id])
    binder_theme = relationship("CosmeticItem", foreign_keys=[equipped_binder_theme_id])
    playmat = relationship("CosmeticItem", foreign_keys=[equipped_playmat_id])
    avatar_frame = relationship("CosmeticItem", foreign_keys=[equipped_avatar_frame_id])
    title = relationship("CosmeticItem", foreign_keys=[equipped_title_id])
