from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, or_

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.user_card import UserCard
from app.models.trade import TradeOffer, TradeStatus
from app.schemas.leaderboard import LeaderboardEntryOut, MyRankOut

router = APIRouter()


def _get_badge(rank: int) -> str:
    if rank == 1:
        return "👑 Grand Champion"
    elif rank == 2:
        return "🥈 Master Tier"
    elif rank == 3:
        return "🥉 Elite Tier"
    elif rank <= 10:
        return "⭐ Top 10"
    return "Collector"


@router.get("/richest", response_model=List[LeaderboardEntryOut])
def get_richest_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.coins.desc(), User.level.desc()).limit(20).all()
    entries = []
    for idx, u in enumerate(users, start=1):
        entries.append(LeaderboardEntryOut(
            rank=idx,
            user_id=u.id,
            username=u.username,
            avatar_url=u.avatar_url,
            value=u.coins,
            badge=_get_badge(idx),
            level=u.level,
        ))
    return entries


@router.get("/collectors", response_model=List[LeaderboardEntryOut])
def get_collectors_leaderboard(db: Session = Depends(get_db)):
    results = (
        db.query(User, func.count(distinct(UserCard.card_id)).label("unique_count"))
        .outerjoin(UserCard, User.id == UserCard.user_id)
        .group_by(User.id)
        .order_by(func.count(distinct(UserCard.card_id)).desc(), User.coins.desc())
        .limit(20)
        .all()
    )
    entries = []
    for idx, (u, count) in enumerate(results, start=1):
        entries.append(LeaderboardEntryOut(
            rank=idx,
            user_id=u.id,
            username=u.username,
            avatar_url=u.avatar_url,
            value=count or 0,
            badge=_get_badge(idx),
            level=u.level,
        ))
    return entries


@router.get("/traders", response_model=List[LeaderboardEntryOut])
def get_traders_leaderboard(db: Session = Depends(get_db)):
    results = (
        db.query(User, func.count(TradeOffer.id).label("trades_count"))
        .outerjoin(
            TradeOffer,
            (TradeOffer.status == TradeStatus.ACCEPTED) &
            ((TradeOffer.sender_id == User.id) | (TradeOffer.receiver_id == User.id))
        )
        .group_by(User.id)
        .order_by(func.count(TradeOffer.id).desc(), User.level.desc())
        .limit(20)
        .all()
    )
    entries = []
    for idx, (u, count) in enumerate(results, start=1):
        entries.append(LeaderboardEntryOut(
            rank=idx,
            user_id=u.id,
            username=u.username,
            avatar_url=u.avatar_url,
            value=count or 0,
            badge=_get_badge(idx),
            level=u.level,
        ))
    return entries


@router.get("/level", response_model=List[LeaderboardEntryOut])
def get_level_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.level.desc(), User.xp.desc(), User.coins.desc()).limit(20).all()
    entries = []
    for idx, u in enumerate(users, start=1):
        entries.append(LeaderboardEntryOut(
            rank=idx,
            user_id=u.id,
            username=u.username,
            avatar_url=u.avatar_url,
            value=u.level,
            badge=_get_badge(idx),
            level=u.level,
        ))
    return entries


@router.get("/me/rank", response_model=MyRankOut)
def get_my_ranks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Richest rank
    higher_coins = db.query(func.count(User.id)).filter(User.coins > current_user.coins).scalar() or 0
    richest_rank = higher_coins + 1

    # Level rank
    higher_level = (
        db.query(func.count(User.id))
        .filter((User.level > current_user.level) | ((User.level == current_user.level) & (User.xp > current_user.xp)))
        .scalar() or 0
    )
    level_rank = higher_level + 1

    # Collectors count & rank
    my_unique = (
        db.query(func.count(distinct(UserCard.card_id)))
        .filter(UserCard.user_id == current_user.id)
        .scalar() or 0
    )
    subq_cards = (
        db.query(UserCard.user_id, func.count(distinct(UserCard.card_id)).label("ucnt"))
        .group_by(UserCard.user_id)
        .subquery()
    )
    higher_cards = db.query(func.count()).select_from(subq_cards).filter(subq_cards.c.ucnt > my_unique).scalar() or 0
    collectors_rank = higher_cards + 1

    # Traders count & rank
    my_trades = (
        db.query(func.count(TradeOffer.id))
        .filter(
            (TradeOffer.status == TradeStatus.ACCEPTED) &
            ((TradeOffer.sender_id == current_user.id) | (TradeOffer.receiver_id == current_user.id))
        )
        .scalar() or 0
    )
    
    # All users' trade counts
    all_users = db.query(User.id).all()
    higher_trades = 0
    for (uid,) in all_users:
        if uid == current_user.id:
            continue
        c = (
            db.query(func.count(TradeOffer.id))
            .filter(
                (TradeOffer.status == TradeStatus.ACCEPTED) &
                ((TradeOffer.sender_id == uid) | (TradeOffer.receiver_id == uid))
            )
            .scalar() or 0
        )
        if c > my_trades:
            higher_trades += 1
    traders_rank = higher_trades + 1

    return MyRankOut(
        richest_rank=richest_rank,
        richest_value=current_user.coins,
        collectors_rank=collectors_rank,
        collectors_value=my_unique,
        traders_rank=traders_rank,
        traders_value=my_trades,
        level_rank=level_rank,
        level_value=current_user.level,
    )
