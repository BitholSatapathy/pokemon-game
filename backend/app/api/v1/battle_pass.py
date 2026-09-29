import json
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.pack import Transaction, PlayerPack
from app.models.tournament import BattlePassSeason, BattlePassReward, UserBattlePass
from app.schemas.tournament import (
    BattlePassSeasonOut,
    BattlePassRewardOut,
    BattlePassClaimOut,
)


router = APIRouter()


def utc_now():
    return datetime.now(timezone.utc)


def ensure_season_1(db: Session) -> BattlePassSeason:
    season = db.query(BattlePassSeason).filter(BattlePassSeason.season_number == 1).first()
    if not season:
        season = BattlePassSeason(
            season_number=1,
            title="Season 1: Kanto Origins",
            theme="Vintage First Edition",
            description="Climb 30 competitive tiers to unlock legendary booster packs, coin bounties, and exclusive champion rewards!",
            start_date=utc_now(),
            end_date=utc_now() + timedelta(days=60),
            is_active=True,
            total_tiers=30,
            xp_per_tier=1000,
            premium_price_gems=500,
        )
        db.add(season)
        db.flush()

        # Seed 30 Tiers of Free & Premium Rewards
        rewards = []
        for tier in range(1, 31):
            # FREE TRACK REWARDS
            if tier % 5 == 0:
                # Milestone Tier: Packs!
                pack_id = "pack_base_set" if tier in [5, 15] else ("pack_jungle" if tier in [10, 20] else "pack_fossil")
                r_free = BattlePassReward(
                    season_id=season.id,
                    tier=tier,
                    is_premium=False,
                    reward_type="pack",
                    reward_amount=1,
                    reference_id=pack_id,
                    title=f"Booster Pack: {pack_id.replace('pack_', '').replace('_', ' ').title()}",
                    icon_url="https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/1stcharizard.jpg",
                )
            elif tier % 2 == 0:
                r_free = BattlePassReward(
                    season_id=season.id,
                    tier=tier,
                    is_premium=False,
                    reward_type="coins",
                    reward_amount=750 + (tier * 100),
                    title=f"Coin Cache (+{750 + (tier * 100):,} Coins)",
                    icon_url="🪙",
                )
            else:
                r_free = BattlePassReward(
                    season_id=season.id,
                    tier=tier,
                    is_premium=False,
                    reward_type="gems",
                    reward_amount=15 + (tier * 2),
                    title=f"Gem Pouch (+{15 + (tier * 2)} Gems)",
                    icon_url="💎",
                )
            rewards.append(r_free)

            # PREMIUM TRACK REWARDS
            if tier == 30:
                r_prem = BattlePassReward(
                    season_id=season.id,
                    tier=tier,
                    is_premium=True,
                    reward_type="pack",
                    reward_amount=3,
                    reference_id="pack_team_rocket",
                    title="Champion Vault: 3x Team Rocket Special Packs + 500 Gems",
                    icon_url="https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/teamrocket1.jpg",
                )
            elif tier % 5 == 0:
                r_prem = BattlePassReward(
                    season_id=season.id,
                    tier=tier,
                    is_premium=True,
                    reward_type="pack",
                    reward_amount=2,
                    reference_id="pack_team_rocket" if tier == 25 else "pack_fossil",
                    title="High-Roller: 2x Booster Packs",
                    icon_url="https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/fossil1.jpg",
                )
            elif tier % 2 == 0:
                r_prem = BattlePassReward(
                    season_id=season.id,
                    tier=tier,
                    is_premium=True,
                    reward_type="coins",
                    reward_amount=2500 + (tier * 250),
                    title=f"Gold Stash (+{2500 + (tier * 250):,} Coins)",
                    icon_url="🪙",
                )
            else:
                r_prem = BattlePassReward(
                    season_id=season.id,
                    tier=tier,
                    is_premium=True,
                    reward_type="gems",
                    reward_amount=50 + (tier * 5),
                    title=f"Prismatic Crystal (+{50 + (tier * 5)} Gems)",
                    icon_url="💎",
                )
            rewards.append(r_prem)

        for r in rewards:
            db.add(r)
        db.commit()

    return season


def _get_or_create_user_pass(season: BattlePassSeason, user: User, db: Session) -> UserBattlePass:
    ubp = db.query(UserBattlePass).filter(
        UserBattlePass.season_id == season.id,
        UserBattlePass.user_id == user.id
    ).first()

    if not ubp:
        # Sync initial tier from user's current account XP
        current_tier = min(season.total_tiers, max(1, 1 + (user.xp // season.xp_per_tier)))
        ubp = UserBattlePass(
            user_id=user.id,
            season_id=season.id,
            current_tier=current_tier,
            current_xp=user.xp,
            has_premium=False,
            claimed_free_tiers="[]",
            claimed_premium_tiers="[]",
        )
        db.add(ubp)
        db.commit()
        db.refresh(ubp)
    else:
        # Keep tier synchronized with user XP
        calc_tier = min(season.total_tiers, max(1, 1 + (user.xp // season.xp_per_tier)))
        if calc_tier > ubp.current_tier:
            ubp.current_tier = calc_tier
            ubp.current_xp = user.xp
            db.commit()

    return ubp


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

@router.get("/current", response_model=BattlePassSeasonOut)
def get_current_battle_pass(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    season = ensure_season_1(db)
    ubp = _get_or_create_user_pass(season, current_user, db)

    claimed_free = set(json.loads(ubp.claimed_free_tiers or "[]"))
    claimed_prem = set(json.loads(ubp.claimed_premium_tiers or "[]"))

    free_list = []
    prem_list = []

    for r in sorted(season.rewards, key=lambda x: (x.tier, x.is_premium)):
        claimed = (r.tier in claimed_prem) if r.is_premium else (r.tier in claimed_free)
        out = BattlePassRewardOut(
            id=r.id,
            tier=r.tier,
            is_premium=r.is_premium,
            reward_type=r.reward_type,
            reward_amount=r.reward_amount,
            reference_id=r.reference_id,
            title=r.title,
            icon_url=r.icon_url,
            is_claimed=claimed,
        )
        if r.is_premium:
            prem_list.append(out)
        else:
            free_list.append(out)

    xp_in_tier = current_user.xp % season.xp_per_tier

    return BattlePassSeasonOut(
        id=season.id,
        season_number=season.season_number,
        title=season.title,
        theme=season.theme,
        description=season.description,
        start_date=season.start_date,
        end_date=season.end_date,
        is_active=season.is_active,
        total_tiers=season.total_tiers,
        xp_per_tier=season.xp_per_tier,
        premium_price_gems=season.premium_price_gems,
        user_tier=ubp.current_tier,
        user_xp=current_user.xp,
        xp_in_current_tier=xp_in_tier,
        has_premium=ubp.has_premium,
        free_rewards=free_list,
        premium_rewards=prem_list,
    )


@router.post("/unlock-premium", response_model=BattlePassSeasonOut)
def unlock_premium_pass(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    season = ensure_season_1(db)
    ubp = _get_or_create_user_pass(season, current_user, db)

    if ubp.has_premium:
        raise HTTPException(400, "You already have the Premium Battle Pass unlocked for Season 1!")

    if current_user.gems < season.premium_price_gems:
        raise HTTPException(
            400,
            f"Insufficient gems. Premium Battle Pass costs {season.premium_price_gems} Gems (you have {current_user.gems})"
        )

    current_user.gems -= season.premium_price_gems
    ubp.has_premium = True

    db.add(Transaction(
        user_id=current_user.id,
        type="BATTLE_PASS_PREMIUM",
        amount=-season.premium_price_gems,
        currency="gems",
        reference_id=str(season.id),
        description=f"Unlocked Premium Battle Pass for {season.title}",
    ))
    db.commit()

    return get_current_battle_pass(db, current_user)


@router.post("/claim/{tier}", response_model=BattlePassClaimOut)
def claim_tier_reward(
    tier: int,
    is_premium: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    season = ensure_season_1(db)
    ubp = _get_or_create_user_pass(season, current_user, db)

    if tier < 1 or tier > season.total_tiers:
        raise HTTPException(400, "Invalid tier number")

    if tier > ubp.current_tier:
        raise HTTPException(400, f"Tier {tier} is locked! You are currently at Tier {ubp.current_tier}")

    if is_premium and not ubp.has_premium:
        raise HTTPException(400, "Premium track is locked. Unlock the Premium Pass to claim this reward!")

    claimed_set = set(json.loads(ubp.claimed_premium_tiers if is_premium else ubp.claimed_free_tiers))
    if tier in claimed_set:
        raise HTTPException(400, f"Tier {tier} reward has already been claimed!")

    # Find reward
    reward = db.query(BattlePassReward).filter(
        BattlePassReward.season_id == season.id,
        BattlePassReward.tier == tier,
        BattlePassReward.is_premium == is_premium,
    ).first()
    if not reward:
        raise HTTPException(404, "Reward definition not found")

    # Apply reward
    if reward.reward_type == "coins":
        current_user.coins += reward.reward_amount
        db.add(Transaction(
            user_id=current_user.id,
            type="BATTLE_PASS_REWARD",
            amount=reward.reward_amount,
            currency="coins",
            reference_id=f"bp_tier_{tier}",
            description=f"Battle Pass Tier {tier} reward: +{reward.reward_amount:,} Coins",
        ))
    elif reward.reward_type == "gems":
        current_user.gems += reward.reward_amount
        db.add(Transaction(
            user_id=current_user.id,
            type="BATTLE_PASS_REWARD",
            amount=reward.reward_amount,
            currency="gems",
            reference_id=f"bp_tier_{tier}",
            description=f"Battle Pass Tier {tier} reward: +{reward.reward_amount} Gems",
        ))
    elif reward.reward_type == "pack" and reward.reference_id:
        pp = db.query(PlayerPack).filter(
            PlayerPack.user_id == current_user.id,
            PlayerPack.pack_id == reward.reference_id
        ).first()
        if pp:
            pp.quantity += reward.reward_amount
        else:
            db.add(PlayerPack(user_id=current_user.id, pack_id=reward.reference_id, quantity=reward.reward_amount))

    # Mark claimed
    claimed_set.add(tier)
    if is_premium:
        ubp.claimed_premium_tiers = json.dumps(sorted(list(claimed_set)))
    else:
        ubp.claimed_free_tiers = json.dumps(sorted(list(claimed_set)))

    db.commit()
    db.refresh(current_user)

    return BattlePassClaimOut(
        tier=tier,
        is_premium=is_premium,
        reward_title=reward.title,
        reward_type=reward.reward_type,
        reward_amount=reward.reward_amount,
        coins_balance=current_user.coins,
        gems_balance=current_user.gems,
        message=f"Successfully claimed {reward.title}!",
    )
