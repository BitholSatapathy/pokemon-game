from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from app.core.database import get_db
from app.models.user import User
from app.models.pack import Pack, PlayerPack, Transaction
from app.models.event import UserStreak, GameEvent, FlashDeal, UserFlashDealPurchase
from app.schemas.event import (
    DailyStreakStatusResponse,
    DailyStreakRewardItem,
    ClaimDailyStreakResponse,
    GameEventResponse,
    FlashDealResponse,
    PurchaseFlashDealResponse,
)
from app.api.v1.auth import get_current_user

router = APIRouter()

STREAK_SCHEDULE = [
    {
        "day": 1,
        "title": "Day 1: Coin Stash",
        "reward_coins": 500,
        "reward_gems": 0,
        "reward_xp": 50,
        "pack_id": None,
        "pack_name": None,
    },
    {
        "day": 2,
        "title": "Day 2: Gem Cluster & XP",
        "reward_coins": 0,
        "reward_gems": 15,
        "reward_xp": 100,
        "pack_id": None,
        "pack_name": None,
    },
    {
        "day": 3,
        "title": "Day 3: Heavy Coin Purse",
        "reward_coins": 750,
        "reward_gems": 0,
        "reward_xp": 75,
        "pack_id": None,
        "pack_name": None,
    },
    {
        "day": 4,
        "title": "Day 4: Base Set Booster",
        "reward_coins": 0,
        "reward_gems": 0,
        "reward_xp": 100,
        "pack_id": "pack_base_set",
        "pack_name": "Base Set Booster",
    },
    {
        "day": 5,
        "title": "Day 5: Vault Bounty",
        "reward_coins": 1000,
        "reward_gems": 25,
        "reward_xp": 125,
        "pack_id": None,
        "pack_name": None,
    },
    {
        "day": 6,
        "title": "Day 6: Veteran's Cache",
        "reward_coins": 1500,
        "reward_gems": 0,
        "reward_xp": 200,
        "pack_id": None,
        "pack_name": None,
    },
    {
        "day": 7,
        "title": "Day 7: Mythic Dragon Hoard",
        "reward_coins": 2500,
        "reward_gems": 50,
        "reward_xp": 300,
        "pack_id": "pack_jungle",
        "pack_name": "Jungle Booster",
    },
]

def get_seconds_to_utc_midnight() -> int:
    now = datetime.utcnow()
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(0, int((midnight - now).total_seconds()))

@router.get("/streak", response_model=DailyStreakStatusResponse)
def get_daily_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    streak_record = db.query(UserStreak).filter(UserStreak.user_id == current_user.id).first()
    if not streak_record:
        streak_record = UserStreak(
            user_id=current_user.id,
            current_streak=0,
            longest_streak=0,
            total_claims=0,
            last_claim_date=None,
        )
        db.add(streak_record)
        db.commit()
        db.refresh(streak_record)

    can_claim_today = (streak_record.last_claim_date != today_str)

    if can_claim_today:
        if streak_record.last_claim_date == yesterday_str:
            next_day = (streak_record.current_streak % 7) + 1
        else:
            next_day = 1
    else:
        next_day = streak_record.current_streak

    calendar = []
    for item in STREAK_SCHEDULE:
        day_num = item["day"]
        if not can_claim_today:
            is_claimed = (day_num <= streak_record.current_streak)
            is_today = False
            is_locked = (day_num > streak_record.current_streak)
        else:
            is_claimed = (day_num < next_day)
            is_today = (day_num == next_day)
            is_locked = (day_num > next_day)

        calendar.append(
            DailyStreakRewardItem(
                day=day_num,
                title=item["title"],
                reward_coins=item["reward_coins"],
                reward_gems=item["reward_gems"],
                reward_xp=item["reward_xp"],
                pack_id=item["pack_id"],
                pack_name=item["pack_name"],
                is_claimed=is_claimed,
                is_today=is_today,
                is_locked=is_locked,
            )
        )

    return DailyStreakStatusResponse(
        current_streak=streak_record.current_streak,
        longest_streak=streak_record.longest_streak,
        total_claims=streak_record.total_claims,
        can_claim_today=can_claim_today,
        last_claim_date=streak_record.last_claim_date,
        seconds_to_reset=get_seconds_to_utc_midnight(),
        calendar=calendar,
    )

@router.post("/streak/claim", response_model=ClaimDailyStreakResponse)
def claim_daily_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    streak_record = db.query(UserStreak).filter(UserStreak.user_id == current_user.id).first()
    if not streak_record:
        streak_record = UserStreak(
            user_id=current_user.id,
            current_streak=0,
            longest_streak=0,
            total_claims=0,
            last_claim_date=None,
        )
        db.add(streak_record)
        db.commit()
        db.refresh(streak_record)

    if streak_record.last_claim_date == today_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already claimed your daily check-in reward today! Return tomorrow for your next reward.",
        )

    if streak_record.last_claim_date == yesterday_str:
        claimed_day = (streak_record.current_streak % 7) + 1
    else:
        claimed_day = 1

    reward = STREAK_SCHEDULE[claimed_day - 1]

    # Award Coins, Gems, XP
    current_user.coins += reward["reward_coins"]
    current_user.gems += reward["reward_gems"]
    current_user.xp += reward["reward_xp"]

    # Check level up
    xp_needed = current_user.level * 200
    while current_user.xp >= xp_needed:
        current_user.xp -= xp_needed
        current_user.level += 1
        current_user.coins += 500
        current_user.gems += 25
        xp_needed = current_user.level * 200

    # Award pack if any
    pack_awarded_name = None
    if reward["pack_id"]:
        pack = db.query(Pack).filter(Pack.id == reward["pack_id"]).first()
        pack_name = pack.name if pack else reward["pack_name"]
        pack_awarded_name = pack_name

        player_pack = (
            db.query(PlayerPack)
            .filter(
                PlayerPack.user_id == current_user.id,
                PlayerPack.pack_id == reward["pack_id"],
            )
            .first()
        )
        if player_pack:
            player_pack.quantity += 1
        else:
            new_player_pack = PlayerPack(
                user_id=current_user.id,
                pack_id=reward["pack_id"],
                quantity=1,
            )
            db.add(new_player_pack)

    # Update Streak
    streak_record.current_streak = claimed_day
    streak_record.longest_streak = max(streak_record.longest_streak, claimed_day)
    streak_record.last_claim_date = today_str
    streak_record.total_claims += 1

    # Log Transaction
    tx = Transaction(
        user_id=current_user.id,
        type="DAILY_STREAK_REWARD",
        amount=reward["reward_coins"],
        currency="coins",
        description=f"Day {claimed_day} Daily Check-in: {reward['title']}",
    )
    db.add(tx)

    db.commit()
    db.refresh(current_user)
    db.refresh(streak_record)

    msg = f"Claimed Day {claimed_day} reward: "
    parts = []
    if reward["reward_coins"] > 0:
        parts.append(f"+{reward['reward_coins']:,} Coins")
    if reward["reward_gems"] > 0:
        parts.append(f"+{reward['reward_gems']} Gems")
    if reward["reward_xp"] > 0:
        parts.append(f"+{reward['reward_xp']} XP")
    if pack_awarded_name:
        parts.append(f"1x {pack_awarded_name}")
    msg += ", ".join(parts) + "!"

    return ClaimDailyStreakResponse(
        success=True,
        message=msg,
        day_claimed=claimed_day,
        reward_coins=reward["reward_coins"],
        reward_gems=reward["reward_gems"],
        reward_xp=reward["reward_xp"],
        pack_awarded=pack_awarded_name,
        new_coin_balance=current_user.coins,
        new_gem_balance=current_user.gems,
        new_level=current_user.level,
        new_xp=current_user.xp,
        new_streak=streak_record.current_streak,
    )

@router.get("/active", response_model=List[GameEventResponse])
def get_active_events(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    events = (
        db.query(GameEvent)
        .filter(GameEvent.is_active == True, GameEvent.end_date > now)
        .all()
    )

    if not events:
        # Seed default event
        season_event = GameEvent(
            id="event_celestial_horizons",
            name="Season 1: Celestial Horizons",
            subtitle="Astral Boosters & 2x XP Surge",
            description="Ascend into Season 1 with Astral booster drops, 2.0x XP on all pack openings, and high-frequency holographic card surges.",
            banner_image="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200",
            badge_text="FEATURED SEASON",
            event_type="SEASONAL",
            buff_xp_multiplier=2.0,
            buff_foil_rate_boost=0.15,
            buff_shop_discount_pct=20,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=6, hours=14),
            is_active=True,
            bounties=[
                {
                    "id": "bounty_celestial_1",
                    "title": "Astral Seeker",
                    "description": "Open 3 booster packs during Celestial Horizons",
                    "target": 3,
                    "reward_coins": 1000,
                    "reward_gems": 50,
                    "icon": "Sparkles",
                },
                {
                    "id": "bounty_celestial_2",
                    "title": "Foil Collector",
                    "description": "Obtain at least 1 Holo Foil card from the event surge",
                    "target": 1,
                    "reward_coins": 1500,
                    "reward_gems": 75,
                    "icon": "Flame",
                },
            ],
        )
        db.add(season_event)
        db.commit()
        db.refresh(season_event)
        events = [season_event]

    result = []
    for ev in events:
        secs_rem = max(0, int((ev.end_date - now).total_seconds()))
        result.append(
            GameEventResponse(
                id=ev.id,
                name=ev.name,
                subtitle=ev.subtitle,
                description=ev.description,
                banner_image=ev.banner_image,
                badge_text=ev.badge_text,
                event_type=ev.event_type,
                buff_xp_multiplier=ev.buff_xp_multiplier,
                buff_foil_rate_boost=ev.buff_foil_rate_boost,
                buff_shop_discount_pct=ev.buff_shop_discount_pct,
                start_date=ev.start_date,
                end_date=ev.end_date,
                seconds_remaining=secs_rem,
                is_active=ev.is_active,
                bounties=ev.bounties or [],
            )
        )
    return result

@router.get("/flash-deal", response_model=FlashDealResponse)
def get_daily_flash_deal(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    deal = db.query(FlashDeal).filter(FlashDeal.deal_date == today_str).first()

    if not deal:
        deal = FlashDeal(
            deal_date=today_str,
            title="Flash Vault: Base Set Booster Special",
            description="Daily limited flash discount on Base Set Booster Packs!",
            pack_id="pack_base_set",
            original_price=1000,
            discount_price=750,
            discount_pct=25,
            bonus_coins=100,
            is_active=True,
        )
        db.add(deal)
        db.commit()
        db.refresh(deal)

    pack = db.query(Pack).filter(Pack.id == deal.pack_id).first()
    pack_name = pack.name if pack else "Base Set Booster"
    pack_image = pack.cover_image if pack else "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"

    has_purchased = False
    if current_user:
        purchase = (
            db.query(UserFlashDealPurchase)
            .filter(
                UserFlashDealPurchase.user_id == current_user.id,
                UserFlashDealPurchase.deal_id == deal.id,
                UserFlashDealPurchase.purchase_date == today_str,
            )
            .first()
        )
        has_purchased = (purchase is not None)

    return FlashDealResponse(
        id=deal.id,
        deal_date=deal.deal_date,
        title=deal.title,
        description=deal.description,
        pack_id=deal.pack_id,
        pack_name=pack_name,
        pack_image=pack_image,
        original_price=deal.original_price,
        discount_price=deal.discount_price,
        discount_pct=deal.discount_pct,
        bonus_coins=deal.bonus_coins,
        can_purchase=(not has_purchased),
        has_purchased=has_purchased,
        seconds_to_reset=get_seconds_to_utc_midnight(),
    )

@router.post("/flash-deal/purchase", response_model=PurchaseFlashDealResponse)
def purchase_daily_flash_deal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    deal = db.query(FlashDeal).filter(FlashDeal.deal_date == today_str).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active flash deal found for today.")

    existing_purchase = (
        db.query(UserFlashDealPurchase)
        .filter(
            UserFlashDealPurchase.user_id == current_user.id,
            UserFlashDealPurchase.deal_id == deal.id,
            UserFlashDealPurchase.purchase_date == today_str,
        )
        .first()
    )
    if existing_purchase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already purchased today's Flash Deal! The vault resets at 00:00 UTC.",
        )

    if current_user.coins < deal.discount_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient coins! You need {deal.discount_price:,} Coins.",
        )

    # Deduct coins
    current_user.coins -= deal.discount_price

    # Add pack to vault
    pack = db.query(Pack).filter(Pack.id == deal.pack_id).first()
    pack_name = pack.name if pack else "Booster Pack"

    player_pack = (
        db.query(PlayerPack)
        .filter(PlayerPack.user_id == current_user.id, PlayerPack.pack_id == deal.pack_id)
        .first()
    )
    if player_pack:
        player_pack.quantity += 1
    else:
        new_player_pack = PlayerPack(user_id=current_user.id, pack_id=deal.pack_id, quantity=1)
        db.add(new_player_pack)

    # Record purchase
    purchase_record = UserFlashDealPurchase(
        user_id=current_user.id,
        deal_id=deal.id,
        purchase_date=today_str,
    )
    db.add(purchase_record)

    # Transaction log
    tx = Transaction(
        user_id=current_user.id,
        type="FLASH_DEAL_PURCHASE",
        amount=-deal.discount_price,
        currency="coins",
        description=f"Purchased Daily Flash Deal: 1x {pack_name} (-{deal.discount_pct}% OFF)",
    )
    db.add(tx)

    db.commit()
    db.refresh(current_user)

    return PurchaseFlashDealResponse(
        success=True,
        message=f"Flash Deal unlocked! 1x {pack_name} added to your unopened pack inventory for {deal.discount_price:,} Coins.",
        pack_name=pack_name,
        price_paid=deal.discount_price,
        new_coin_balance=current_user.coins,
    )
