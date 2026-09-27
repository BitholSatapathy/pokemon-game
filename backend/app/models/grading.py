from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class GradedCard(Base):
    __tablename__ = "graded_cards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_card_id = Column(Integer, ForeignKey("user_cards.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    cert_number = Column(String(50), unique=True, index=True, nullable=False)
    grade = Column(Float, nullable=False)
    grade_label = Column(String(50), nullable=False)
    sub_centering = Column(Float, nullable=False)
    sub_corners = Column(Float, nullable=False)
    sub_edges = Column(Float, nullable=False)
    sub_surface = Column(Float, nullable=False)
    service_tier = Column(String(50), default="standard", nullable=False)
    value_multiplier = Column(Float, default=1.0, nullable=False)
    graded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User")
    user_card = relationship("UserCard")
