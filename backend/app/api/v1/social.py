from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, or_

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.user_card import UserCard
from app.models.card import Card
from app.models.trade import TradeOffer, TradeStatus
from app.models.social import Follow
from app.schemas.social import (
    FollowOut,
    FollowCountsOut,
    SocialUserBasic,
    PublicProfileOut,
    ShowcaseCardOut,
)

router = APIRouter()


@router.post("/follow/{user_id}", response_model=FollowOut)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself",
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found",
        )

    existing = (
        db.query(Follow)
        .filter(Follow.follower_id == current_user.id, Follow.following_id == user_id)
        .first()
    )
    if existing:
        return existing

    new_follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(new_follow)
    db.commit()
    db.refresh(new_follow)
    return new_follow


@router.delete("/follow/{user_id}")
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow_rel = (
        db.query(Follow)
        .filter(Follow.follower_id == current_user.id, Follow.following_id == user_id)
        .first()
    )
    if follow_rel:
        db.delete(follow_rel)
        db.commit()
    return {"detail": "Unfollowed successfully"}


@router.get("/followers/{user_id}", response_model=List[SocialUserBasic])
def get_followers(user_id: int, db: Session = Depends(get_db)):
    followers = (
        db.query(User)
        .join(Follow, Follow.follower_id == User.id)
        .filter(Follow.following_id == user_id)
        .all()
    )
    return followers


@router.get("/following/{user_id}", response_model=List[SocialUserBasic])
def get_following(user_id: int, db: Session = Depends(get_db)):
    following = (
        db.query(User)
        .join(Follow, Follow.following_id == User.id)
        .filter(Follow.follower_id == user_id)
        .all()
    )
    return following


@router.get("/counts/{user_id}", response_model=FollowCountsOut)
def get_follow_counts(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    followers_count = db.query(func.count(Follow.id)).filter(Follow.following_id == user_id).scalar() or 0
    following_count = db.query(func.count(Follow.id)).filter(Follow.follower_id == user_id).scalar() or 0
    is_following = False
    if current_user:
        is_following = (
            db.query(Follow)
            .filter(Follow.follower_id == current_user.id, Follow.following_id == user_id)
            .first()
            is not None
        )
    return FollowCountsOut(
        user_id=user_id,
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
    )


@router.get("/profile/{username}", response_model=PublicProfileOut)
def get_public_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player '{username}' not found",
        )

    # Total and unique cards
    total_cards = (
        db.query(func.coalesce(func.sum(UserCard.quantity), 0))
        .filter(UserCard.user_id == target.id)
        .scalar() or 0
    )
    unique_cards = (
        db.query(func.count(distinct(UserCard.card_id)))
        .filter(UserCard.user_id == target.id)
        .scalar() or 0
    )

    # Completed trades
    completed_trades = (
        db.query(func.count(TradeOffer.id))
        .filter(
            (TradeOffer.status == TradeStatus.ACCEPTED) &
            ((TradeOffer.sender_id == target.id) | (TradeOffer.receiver_id == target.id))
        )
        .scalar() or 0
    )

    # Social counts
    followers_count = db.query(func.count(Follow.id)).filter(Follow.following_id == target.id).scalar() or 0
    following_count = db.query(func.count(Follow.id)).filter(Follow.follower_id == target.id).scalar() or 0
    is_following = False
    if current_user and current_user.id != target.id:
        is_following = (
            db.query(Follow)
            .filter(Follow.follower_id == current_user.id, Follow.following_id == target.id)
            .first()
            is not None
        )

    # Top 6 showcase cards (prefer foils and highest market price)
    user_cards = (
        db.query(UserCard)
        .join(Card, UserCard.card_id == Card.id)
        .filter(UserCard.user_id == target.id)
        .order_by(UserCard.is_foil.desc(), Card.market_price.desc())
        .limit(6)
        .all()
    )

    top_cards = []
    for uc in user_cards:
        if uc.card:
            top_cards.append(ShowcaseCardOut(
                id=uc.id,
                card_id=uc.card_id,
                name=uc.card.name,
                image_url=uc.card.image_url,
                rarity=uc.card.rarity,
                is_foil=uc.is_foil,
                quantity=uc.quantity,
            ))

    return PublicProfileOut(
        id=target.id,
        username=target.username,
        avatar_url=target.avatar_url,
        level=target.level,
        xp=target.xp,
        created_at=target.created_at,
        coins=target.coins,
        total_cards=total_cards,
        unique_cards=unique_cards,
        completed_trades=completed_trades,
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
        top_cards=top_cards,
    )
