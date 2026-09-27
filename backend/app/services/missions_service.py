from datetime import datetime, timezone, timedelta
from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from app.models.user import User
from app.models.card import Card
from app.models.user_card import UserCard
from app.models.pack import Transaction
from app.models.mission import Mission, UserMission
from app.schemas.mission import (
    UserMissionResponse,
    MissionsSummaryResponse,
    MissionClaimResponse,
    PlayerProgressionResponse,
)

DEFAULT_MISSIONS = [
    # Daily Directives
    {
        "id": "daily_open_pack",
        "category": "daily",
        "title": "Pack Ripper",
        "description": "Unseal 1 Booster Pack in the Pack Opening stage.",
        "target": 1,
        "reward_xp": 50,
        "reward_coins": 250,
        "reward_gems": 0,
        "icon": "package-open",
        "action_type": "open_pack",
    },
    {
        "id": "daily_sell_card",
        "category": "daily",
        "title": "Liquidator",
        "description": "Sell 1 card or duplicate copy for instant coins.",
        "target": 1,
        "reward_xp": 40,
        "reward_coins": 200,
        "reward_gems": 0,
        "icon": "dollar-sign",
        "action_type": "sell_card",
    },
    {
        "id": "daily_buy_pack",
        "category": "daily",
        "title": "Shop Patron",
        "description": "Acquire 1 Booster Pack from the official Shop.",
        "target": 1,
        "reward_xp": 60,
        "reward_coins": 300,
        "reward_gems": 0,
        "icon": "shopping-bag",
        "action_type": "buy_pack",
    },
    # Weekly Bounties
    {
        "id": "weekly_open_5_packs",
        "category": "weekly",
        "title": "Master Unboxer",
        "description": "Rip open 5 booster packs across the week.",
        "target": 5,
        "reward_xp": 200,
        "reward_coins": 1000,
        "reward_gems": 25,
        "icon": "flame",
        "action_type": "open_pack",
    },
    {
        "id": "weekly_sell_duplicates",
        "category": "weekly",
        "title": "Market Baron",
        "description": "Liquidate 3 cards or duplicate copies.",
        "target": 3,
        "reward_xp": 150,
        "reward_coins": 800,
        "reward_gems": 15,
        "icon": "trending-up",
        "action_type": "sell_card",
    },
    # Lifetime Milestones / Achievements
    {
        "id": "achieve_first_pull",
        "category": "achievement",
        "title": "First Pull",
        "description": "Unseal your very first booster pack.",
        "target": 1,
        "reward_xp": 100,
        "reward_coins": 500,
        "reward_gems": 10,
        "icon": "award",
        "action_type": "open_pack",
    },
    {
        "id": "achieve_collect_10",
        "category": "achievement",
        "title": "Novice Collector",
        "description": "Add at least 10 unique cards to your collection binder.",
        "target": 10,
        "reward_xp": 150,
        "reward_coins": 750,
        "reward_gems": 20,
        "icon": "layers",
        "action_type": "collect_unique",
    },
    {
        "id": "achieve_collect_25",
        "category": "achievement",
        "title": "Kanto Archivist",
        "description": "Collect 25 unique cards from the Base Set.",
        "target": 25,
        "reward_xp": 300,
        "reward_coins": 1500,
        "reward_gems": 50,
        "icon": "sparkles",
        "action_type": "collect_unique",
    },
    {
        "id": "achieve_first_holo",
        "category": "achievement",
        "title": "Shining Artifact",
        "description": "Own at least 1 Rare Holo or Foil card in your vault.",
        "target": 1,
        "reward_xp": 250,
        "reward_coins": 1000,
        "reward_gems": 30,
        "icon": "star",
        "action_type": "collect_holo",
    },
]

def utc_now():
    return datetime.now(timezone.utc)

def ensure_default_missions(db: Session):
    for m_data in DEFAULT_MISSIONS:
        existing = db.query(Mission).filter(Mission.id == m_data["id"]).first()
        if not existing:
            mission = Mission(**m_data)
            db.add(mission)
    db.commit()

def get_rank_title(level: int) -> str:
    if level >= 15:
        return "Grandmaster Collector"
    elif level >= 10:
        return "Elite Champion"
    elif level >= 7:
        return "Veteran Trainer"
    elif level >= 5:
        return "Master Collector"
    elif level >= 3:
        return "Skilled Collector"
    elif level >= 2:
        return "Apprentice Collector"
    else:
        return "Novice Collector"

def sync_user_missions(user: User, db: Session) -> MissionsSummaryResponse:
    ensure_default_missions(db)
    now = utc_now()

    # Time boundaries
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    start_of_week = start_of_day - timedelta(days=now.weekday())

    # Keys
    daily_key = now.strftime("%Y-%m-%d")
    weekly_key = f"{now.year}-W{now.isocalendar()[1]:02d}"
    lifetime_key = "lifetime"

    # Aggregated Stats
    # 1. Today's transactions
    today_txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id, Transaction.created_at >= start_of_day)
        .all()
    )
    today_packs_opened = sum(1 for tx in today_txs if tx.type == "PACK_OPEN")
    today_packs_bought = sum(1 for tx in today_txs if tx.type == "PACK_PURCHASE")
    today_cards_sold = sum(1 for tx in today_txs if tx.type in ("CARD_SALE", "BULK_CARD_SALE"))

    # 2. Week's transactions
    week_txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id, Transaction.created_at >= start_of_week)
        .all()
    )
    week_packs_opened = sum(1 for tx in week_txs if tx.type == "PACK_OPEN")
    week_cards_sold = sum(1 for tx in week_txs if tx.type in ("CARD_SALE", "BULK_CARD_SALE"))

    # 3. Lifetime stats
    lifetime_packs_opened = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.user_id == user.id, Transaction.type == "PACK_OPEN")
        .scalar() or 0
    )
    unique_cards_owned = (
        db.query(func.count(distinct(UserCard.card_id)))
        .filter(UserCard.user_id == user.id)
        .scalar() or 0
    )
    holo_cards_owned = (
        db.query(func.count(UserCard.id))
        .join(Card, UserCard.card_id == Card.id)
        .filter(UserCard.user_id == user.id, (UserCard.is_foil == True) | (Card.rarity == "Rare Holo"))
        .scalar() or 0
    )

    missions = db.query(Mission).all()

    daily_responses: List[UserMissionResponse] = []
    weekly_responses: List[UserMissionResponse] = []
    achievement_responses: List[UserMissionResponse] = []
    claimable_count = 0

    for mission in missions:
        if mission.category == "daily":
            p_key = daily_key
            if mission.action_type == "open_pack":
                current_prog = today_packs_opened
            elif mission.action_type == "buy_pack":
                current_prog = today_packs_bought
            elif mission.action_type == "sell_card":
                current_prog = today_cards_sold
            else:
                current_prog = 0
        elif mission.category == "weekly":
            p_key = weekly_key
            if mission.action_type == "open_pack":
                current_prog = week_packs_opened
            elif mission.action_type == "sell_card":
                current_prog = week_cards_sold
            else:
                current_prog = 0
        else:  # achievement
            p_key = lifetime_key
            if mission.action_type == "open_pack":
                current_prog = lifetime_packs_opened
            elif mission.action_type == "collect_unique":
                current_prog = unique_cards_owned
            elif mission.action_type == "collect_holo":
                current_prog = holo_cards_owned
            else:
                current_prog = 0

        user_mission = (
            db.query(UserMission)
            .filter(
                UserMission.user_id == user.id,
                UserMission.mission_id == mission.id,
                UserMission.period_key == p_key
            )
            .first()
        )

        is_completed = current_prog >= mission.target

        if not user_mission:
            user_mission = UserMission(
                user_id=user.id,
                mission_id=mission.id,
                period_key=p_key,
                progress=current_prog,
                is_completed=is_completed,
                is_claimed=False
            )
            db.add(user_mission)
        else:
            user_mission.progress = current_prog
            if is_completed:
                user_mission.is_completed = True

        percent = min(100, int((current_prog / mission.target) * 100)) if mission.target > 0 else 100
        if user_mission.is_completed and not user_mission.is_claimed:
            claimable_count += 1

        item_resp = UserMissionResponse(
            id=mission.id,
            mission_id=mission.id,
            category=mission.category,
            title=mission.title,
            description=mission.description,
            target=mission.target,
            progress=min(current_prog, mission.target),
            percent=percent,
            is_completed=user_mission.is_completed,
            is_claimed=user_mission.is_claimed,
            reward_xp=mission.reward_xp,
            reward_coins=mission.reward_coins,
            reward_gems=mission.reward_gems,
            icon=mission.icon
        )

        if mission.category == "daily":
            daily_responses.append(item_resp)
        elif mission.category == "weekly":
            weekly_responses.append(item_resp)
        else:
            achievement_responses.append(item_resp)

    db.commit()

    # Calculate reset seconds
    next_day = start_of_day + timedelta(days=1)
    daily_reset_seconds = max(0, int((next_day - now).total_seconds()))

    next_week = start_of_week + timedelta(days=7)
    weekly_reset_seconds = max(0, int((next_week - now).total_seconds()))

    return MissionsSummaryResponse(
        daily=daily_responses,
        weekly=weekly_responses,
        achievements=achievement_responses,
        daily_reset_seconds=daily_reset_seconds,
        weekly_reset_seconds=weekly_reset_seconds,
        claimable_count=claimable_count
    )

def claim_mission_reward(user: User, mission_id: str, db: Session) -> MissionClaimResponse:
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise ValueError(f"Mission '{mission_id}' not found.")

    now = utc_now()
    if mission.category == "daily":
        p_key = now.strftime("%Y-%m-%d")
    elif mission.category == "weekly":
        p_key = f"{now.year}-W{now.isocalendar()[1]:02d}"
    else:
        p_key = "lifetime"

    user_mission = (
        db.query(UserMission)
        .filter(
            UserMission.user_id == user.id,
            UserMission.mission_id == mission.id,
            UserMission.period_key == p_key
        )
        .first()
    )

    if not user_mission:
        raise ValueError("Mission progress has not been initialized. Open the Missions page first.")

    if not user_mission.is_completed:
        raise ValueError("Mission requirement has not been fulfilled yet.")

    if user_mission.is_claimed:
        raise ValueError("Reward for this mission has already been claimed.")

    # Mark claimed
    user_mission.is_claimed = True
    user_mission.claimed_at = now

    # Award currency & XP
    user.coins += mission.reward_coins
    user.gems += mission.reward_gems
    user.xp += mission.reward_xp

    # Check level up
    leveled_up = False
    old_level = user.level
    bonus_coins = 0
    bonus_gems = 0

    threshold = user.level * 200
    while user.xp >= threshold:
        user.xp -= threshold
        user.level += 1
        leveled_up = True
        bonus_coins += 500
        bonus_gems += 25
        threshold = user.level * 200

    user.coins += bonus_coins
    user.gems += bonus_gems

    # Log mission reward transaction
    tx_mission = Transaction(
        user_id=user.id,
        type="MISSION_REWARD",
        amount=mission.reward_coins,
        currency="coins",
        reference_id=mission.id,
        description=f"Claimed {mission.title} (+{mission.reward_xp} XP, +{mission.reward_coins} Coins)"
    )
    db.add(tx_mission)

    if leveled_up:
        tx_level = Transaction(
            user_id=user.id,
            type="LEVEL_UP_REWARD",
            amount=bonus_coins,
            currency="coins",
            reference_id=f"level_{user.level}",
            description=f"Level Up to Level {user.level}! (+{bonus_coins} Coins, +{bonus_gems} Gems)"
        )
        db.add(tx_level)

    db.commit()
    db.refresh(user)

    bonuses = None
    if leveled_up:
        bonuses = {
            "old_level": old_level,
            "new_level": user.level,
            "bonus_coins": bonus_coins,
            "bonus_gems": bonus_gems,
            "new_rank": get_rank_title(user.level)
        }

    return MissionClaimResponse(
        success=True,
        message=f"Claimed reward for {mission.title}!",
        mission_id=mission.id,
        reward_xp=mission.reward_xp,
        reward_coins=mission.reward_coins,
        reward_gems=mission.reward_gems,
        new_coins=user.coins,
        new_gems=user.gems,
        new_level=user.level,
        new_xp=user.xp,
        leveled_up=leveled_up,
        level_up_bonuses=bonuses
    )

def get_player_progression(user: User, db: Session) -> PlayerProgressionResponse:
    threshold = user.level * 200
    percent = min(100, int((user.xp / threshold) * 100)) if threshold > 0 else 100

    total_packs = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.user_id == user.id, Transaction.type == "PACK_OPEN")
        .scalar() or 0
    )
    total_cards = (
        db.query(func.count(distinct(UserCard.card_id)))
        .filter(UserCard.user_id == user.id)
        .scalar() or 0
    )

    return PlayerProgressionResponse(
        level=user.level,
        title=get_rank_title(user.level),
        xp=user.xp,
        next_level_xp=threshold,
        xp_percentage=percent,
        coins=user.coins,
        gems=user.gems,
        total_packs_opened=total_packs,
        total_cards_collected=total_cards
    )
