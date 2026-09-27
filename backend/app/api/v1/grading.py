import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.user_card import UserCard
from app.models.pack import Transaction
from app.models.grading import GradedCard
from app.schemas.grading import (
    GradedCardOut,
    GradingSubmitIn,
    GradingRatesOut,
    GradingRateTier,
)

router = APIRouter()

TIERS = {
    "standard": {
        "id": "standard",
        "name": "Standard Authentication & Grading",
        "price_coins": 500,
        "description": "Professional 4-point inspection with tamper-proof acrylic slab encapsulation.",
        "bonus_luck": 0.0,
    },
    "express": {
        "id": "express",
        "name": "Express Priority Slab Service",
        "price_coins": 1500,
        "description": "High-priority microscopic laser inspection with +0.5 subgrade luck enhancement.",
        "bonus_luck": 0.5,
    },
}

GRADE_LABELS = {
    10.0: "GEM MINT 10",
    9.5: "GEM MINT 9.5",
    9.0: "MINT 9",
    8.5: "NEAR MINT-MINT 8.5",
    8.0: "NEAR MINT 8",
    7.5: "EXCELLENT-MINT 7.5",
    7.0: "EXCELLENT 7",
}


def _calc_subgrade(bonus: float) -> float:
    # Choices: 8.0, 8.5, 9.0, 9.5, 10.0
    weights = [0.08, 0.15, 0.32, 0.30, 0.15]
    if bonus > 0:
        weights = [0.02, 0.08, 0.25, 0.35, 0.30]
    sub = random.choices([8.0, 8.5, 9.0, 9.5, 10.0], weights=weights, k=1)[0]
    return min(10.0, sub)


def _format_graded_out(gc: GradedCard) -> GradedCardOut:
    uc = gc.user_card
    card = uc.card if uc else None
    base_price = card.market_price if card else 500
    graded_price = int(base_price * gc.value_multiplier)

    return GradedCardOut(
        id=gc.id,
        user_card_id=gc.user_card_id,
        card_id=card.id if card else "unknown",
        card_name=card.name if card else "Card",
        set_name=card.card_set.name if card and card.card_set else "Base Set",
        card_number=card.number if card else "1",
        image_url=card.image_url if card else None,
        rarity=card.rarity if card else "Common",
        is_foil=uc.is_foil if uc else False,
        cert_number=gc.cert_number,
        grade=gc.grade,
        grade_label=gc.grade_label,
        sub_centering=gc.sub_centering,
        sub_corners=gc.sub_corners,
        sub_edges=gc.sub_edges,
        sub_surface=gc.sub_surface,
        service_tier=gc.service_tier,
        value_multiplier=gc.value_multiplier,
        graded_price=graded_price,
        base_price=base_price,
        graded_at=gc.graded_at,
    )


@router.get("/rates", response_model=GradingRatesOut)
def get_grading_rates():
    return GradingRatesOut(
        tiers=[GradingRateTier(**t) for t in TIERS.values()],
        grade_tiers={
            "10.0": "GEM MINT 10 (5.0x Market Multiplier)",
            "9.5": "GEM MINT 9.5 (3.5x Market Multiplier)",
            "9.0": "MINT 9 (2.2x Market Multiplier)",
            "8.5": "NM-MT 8.5 (1.6x Market Multiplier)",
            "8.0": "NM 8 (1.2x Market Multiplier)",
        },
    )


@router.get("/slabs/me", response_model=List[GradedCardOut])
def get_my_slabs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slabs = (
        db.query(GradedCard)
        .filter(GradedCard.user_id == current_user.id)
        .order_by(GradedCard.grade.desc(), GradedCard.graded_at.desc())
        .all()
    )
    return [_format_graded_out(s) for s in slabs]


@router.post("/submit", response_model=GradedCardOut)
def submit_for_grading(
    payload: GradingSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tier_info = TIERS.get(payload.service_tier)
    if not tier_info:
        raise HTTPException(status_code=400, detail="Invalid service tier")

    # Check coin balance
    price = tier_info["price_coins"]
    if current_user.coins < price:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient coins: fee is {price:,}, you have {current_user.coins:,}",
        )

    # Validate ownership
    user_card = (
        db.query(UserCard)
        .filter(UserCard.id == payload.user_card_id, UserCard.user_id == current_user.id)
        .first()
    )
    if not user_card or user_card.quantity < 1:
        raise HTTPException(status_code=400, detail="Card not found in your vault")

    # Check if already graded
    existing = (
        db.query(GradedCard)
        .filter(GradedCard.user_card_id == user_card.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="This card is already encapsulated in an NGS slab")

    # Deduct coins
    current_user.coins -= price
    card_name = user_card.card.name if user_card.card else "Card"

    # Compute Subgrades
    bonus = tier_info["bonus_luck"]
    # If card is foil, slightly higher centering/surface luck
    if user_card.is_foil:
        bonus += 0.2

    centering = _calc_subgrade(bonus)
    corners = _calc_subgrade(bonus)
    edges = _calc_subgrade(bonus)
    surface = _calc_subgrade(bonus)

    subs = [centering, corners, edges, surface]
    min_sub = min(subs)
    avg_sub = sum(subs) / 4.0

    # Official grading rule: final grade cannot exceed lowest subgrade + 0.5
    raw_grade = min(avg_sub, min_sub + 0.5)
    # Round to nearest 0.5
    final_grade = round(raw_grade * 2) / 2.0
    final_grade = min(10.0, max(7.0, final_grade))

    # Label & Multiplier
    if final_grade == 10.0 and all(s == 10.0 for s in subs):
        label = "PRISTINE 10"
        mult = 6.0
    elif final_grade == 10.0:
        label = "GEM MINT 10"
        mult = 5.0
    elif final_grade == 9.5:
        label = "GEM MINT 9.5"
        mult = 3.5
    elif final_grade == 9.0:
        label = "MINT 9"
        mult = 2.2
    elif final_grade == 8.5:
        label = "NEAR MINT-MINT 8.5"
        mult = 1.6
    elif final_grade == 8.0:
        label = "NEAR MINT 8"
        mult = 1.2
    else:
        label = "EXCELLENT 7"
        mult = 1.0

    # Generate unique cert number
    while True:
        serial = f"NGS-{random.randint(100000, 999999)}"
        if not db.query(GradedCard).filter(GradedCard.cert_number == serial).first():
            break

    slab = GradedCard(
        user_card_id=user_card.id,
        user_id=current_user.id,
        cert_number=serial,
        grade=final_grade,
        grade_label=label,
        sub_centering=centering,
        sub_corners=corners,
        sub_edges=edges,
        sub_surface=surface,
        service_tier=payload.service_tier,
        value_multiplier=mult,
    )
    db.add(slab)

    # Log transaction
    tx = Transaction(
        user_id=current_user.id,
        type="GRADING_FEE",
        amount=-price,
        currency="coins",
        reference_id=serial,
        description=f"Grading fee for {card_name} ({tier_info['name']})",
    )
    db.add(tx)

    db.commit()
    db.refresh(slab)

    return _format_graded_out(slab)


@router.get("/verify/{cert_number}", response_model=GradedCardOut)
def verify_cert(
    cert_number: str,
    db: Session = Depends(get_db),
):
    slab = db.query(GradedCard).filter(GradedCard.cert_number == cert_number.upper()).first()
    if not slab:
        raise HTTPException(
            status_code=404,
            detail=f"Certificate number '{cert_number}' not found in NGS verification database",
        )
    return _format_graded_out(slab)
