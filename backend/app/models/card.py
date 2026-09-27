from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Series(Base):
    __tablename__ = "series"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    logo_url = Column(String(255), nullable=True)

    sets = relationship("CardSet", back_populates="series", cascade="all, delete-orphan")


class CardSet(Base):
    __tablename__ = "sets"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    series_id = Column(String(50), ForeignKey("series.id"), nullable=False)
    total_cards = Column(Integer, default=102, nullable=False)
    logo_url = Column(String(255), nullable=True)
    symbol_url = Column(String(255), nullable=True)
    release_date = Column(String(50), nullable=True)

    series = relationship("Series", back_populates="sets")
    cards = relationship("Card", back_populates="card_set", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "cards"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    set_id = Column(String(50), ForeignKey("sets.id"), nullable=False, index=True)
    number = Column(String(20), nullable=False)
    rarity = Column(String(50), nullable=False, index=True)
    types = Column(String(100), nullable=True)  # Comma-separated or JSON string, e.g. "Fire"
    hp = Column(Integer, nullable=True)
    image_url = Column(String(255), nullable=False)
    market_price = Column(Integer, default=500, nullable=False)
    flavor_text = Column(String(500), nullable=True)
    artist = Column(String(100), nullable=True)

    card_set = relationship("CardSet", back_populates="cards")
