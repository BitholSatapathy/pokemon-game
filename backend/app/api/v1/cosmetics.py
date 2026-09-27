from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.pack import Transaction
from app.models.cosmetic import (
    CosmeticItem,
    UserCosmetic,
    UserEquippedCosmetics,
    CosmeticType,
    CosmeticRarity,
)
from app.schemas.cosmetic import (
    CosmeticItemOut,
    EquippedCosmeticsOut,
    EquipRequest,
    BuyCosmeticRequest,
)

router = APIRouter()


DEFAULT_CATALOGUE = [
    # Card Sleeves
    {
        "id": "sleeve_classic_obsidian",
        "name": "Obsidian Vault Sleeve",
        "type": CosmeticType.SLEEVE,
        "rarity": CosmeticRarity.COMMON,
        "price_coins": 0,
        "price_gems": 0,
        "preview_url": "from-slate-900 to-black border-slate-700",
        "asset_data": "border-slate-700 bg-gradient-to-b from-slate-900 to-black text-slate-400",
        "description": "Standard issue obsidian polymer card protector.",
        "is_default": True,
    },
    {
        "id": "sleeve_cyber_neon",
        "name": "Cyber Neon Sleeve",
        "type": CosmeticType.SLEEVE,
        "rarity": CosmeticRarity.RARE,
        "price_coins": 2500,
        "price_gems": 50,
        "preview_url": "from-cyan-500 via-purple-600 to-pink-500",
        "asset_data": "border-cyan-400/60 bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 text-white shadow-glow-purple",
        "description": "Electroluminescent polymer sleeve infused with retro synth-wave neon.",
        "is_default": False,
    },
    {
        "id": "sleeve_dragon_flame",
        "name": "Dragonfire Sleeve",
        "type": CosmeticType.SLEEVE,
        "rarity": CosmeticRarity.EPIC,
        "price_coins": 5000,
        "price_gems": 120,
        "preview_url": "from-orange-600 via-amber-500 to-red-600",
        "asset_data": "border-orange-500/70 bg-gradient-to-b from-red-600 via-orange-500 to-amber-600 text-yellow-100 shadow-[0_0_15px_rgba(249,115,22,0.4)]",
        "description": "Forged in the heart of a volcanic caldera. Radiates intense embers.",
        "is_default": False,
    },
    {
        "id": "sleeve_golden_nexus",
        "name": "Golden Nexus Holo Sleeve",
        "type": CosmeticType.SLEEVE,
        "rarity": CosmeticRarity.LEGENDARY,
        "price_coins": 10000,
        "price_gems": 250,
        "preview_url": "from-amber-300 via-yellow-500 to-yellow-600",
        "asset_data": "border-amber-300 bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 text-black shadow-glow-amber font-bold",
        "description": "Pure 24k gold leaf weave woven with iridescent foil fibers.",
        "is_default": False,
    },
    # Binder Themes
    {
        "id": "theme_classic_dark",
        "name": "Obsidian Deep",
        "type": CosmeticType.BINDER_THEME,
        "rarity": CosmeticRarity.COMMON,
        "price_coins": 0,
        "price_gems": 0,
        "preview_url": "bg-[#0B0B14]",
        "asset_data": "bg-[#0B0B14] border-white/10",
        "description": "Clean, minimal dark obsidian aesthetic.",
        "is_default": True,
    },
    {
        "id": "theme_midnight_cyber",
        "name": "Midnight Cyberpunk",
        "type": CosmeticType.BINDER_THEME,
        "rarity": CosmeticRarity.RARE,
        "price_coins": 3000,
        "price_gems": 60,
        "preview_url": "from-[#0B0C1E] via-[#1A103C] to-[#0D1527]",
        "asset_data": "bg-gradient-to-br from-[#0B0C1E] via-[#1A103C] to-[#0D1527] border-purple-500/30",
        "description": "High-tech synthwave grid aesthetic bathed in ultraviolet light.",
        "is_default": False,
    },
    {
        "id": "theme_emerald_forest",
        "name": "Viridian Sanctuary",
        "type": CosmeticType.BINDER_THEME,
        "rarity": CosmeticRarity.RARE,
        "price_coins": 3000,
        "price_gems": 60,
        "preview_url": "from-[#081C15] via-[#1B4332] to-[#081C15]",
        "asset_data": "bg-gradient-to-br from-[#081C15] via-[#1B4332] to-[#081C15] border-emerald-500/30",
        "description": "Lush moss, deep forestry, and serene botanical hues.",
        "is_default": False,
    },
    {
        "id": "theme_celestial_galaxy",
        "name": "Celestial Nebula",
        "type": CosmeticType.BINDER_THEME,
        "rarity": CosmeticRarity.LEGENDARY,
        "price_coins": 12000,
        "price_gems": 300,
        "preview_url": "from-[#12002B] via-[#2D0B5A] to-[#0B0014]",
        "asset_data": "bg-gradient-to-br from-[#12002B] via-[#2D0B5A] to-[#0B0014] border-indigo-400/40 shadow-2xl",
        "description": "A window into deep space with shimmering astral dust.",
        "is_default": False,
    },
    # Playmats
    {
        "id": "mat_classic_felt",
        "name": "Classic Arena Felt",
        "type": CosmeticType.PLAYMAT,
        "rarity": CosmeticRarity.COMMON,
        "price_coins": 0,
        "price_gems": 0,
        "preview_url": "bg-slate-950/70 border-slate-800",
        "asset_data": "border-slate-800 bg-slate-950/70",
        "description": "Heavy-duty tournament felt playmat.",
        "is_default": True,
    },
    {
        "id": "mat_volcano_shrine",
        "name": "Magma Basin",
        "type": CosmeticType.PLAYMAT,
        "rarity": CosmeticRarity.RARE,
        "price_coins": 3500,
        "price_gems": 75,
        "preview_url": "from-red-950/80 via-black to-orange-950/80",
        "asset_data": "border-orange-500/40 bg-gradient-to-r from-red-950/80 via-black to-orange-950/80",
        "description": "Volcanic stone floor etched with runic cooling lava veins.",
        "is_default": False,
    },
    {
        "id": "mat_champion_arena",
        "name": "Grandmaster Dais",
        "type": CosmeticType.PLAYMAT,
        "rarity": CosmeticRarity.LEGENDARY,
        "price_coins": 10000,
        "price_gems": 250,
        "preview_url": "from-yellow-950/80 via-purple-950/80 to-amber-950/80",
        "asset_data": "border-amber-400/50 bg-gradient-to-r from-yellow-950/80 via-purple-950/80 to-amber-950/80 shadow-glow-amber",
        "description": "The golden podium reserved for tournament victors.",
        "is_default": False,
    },
    # Avatar Frames
    {
        "id": "frame_default",
        "name": "Standard Titanium",
        "type": CosmeticType.AVATAR_FRAME,
        "rarity": CosmeticRarity.COMMON,
        "price_coins": 0,
        "price_gems": 0,
        "preview_url": "border-white/20",
        "asset_data": "border-2 border-white/20",
        "description": "Standard brushed titanium avatar rim.",
        "is_default": True,
    },
    {
        "id": "frame_neon_pulse",
        "name": "Neon Cyan Pulse",
        "type": CosmeticType.AVATAR_FRAME,
        "rarity": CosmeticRarity.RARE,
        "price_coins": 2000,
        "price_gems": 40,
        "preview_url": "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]",
        "asset_data": "border-2 border-cyan-400 ring-2 ring-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.5)]",
        "description": "Vibrant glowing cyan energy halo.",
        "is_default": False,
    },
    {
        "id": "frame_flame_emperor",
        "name": "Flame Emperor Ring",
        "type": CosmeticType.AVATAR_FRAME,
        "rarity": CosmeticRarity.EPIC,
        "price_coins": 5000,
        "price_gems": 100,
        "preview_url": "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]",
        "asset_data": "border-2 border-orange-500 ring-2 ring-amber-500/40 shadow-[0_0_20px_rgba(249,115,22,0.6)]",
        "description": "Surrounds your profile portrait with dancing embers.",
        "is_default": False,
    },
    {
        "id": "frame_celestial_halo",
        "name": "Celestial Halo",
        "type": CosmeticType.AVATAR_FRAME,
        "rarity": CosmeticRarity.LEGENDARY,
        "price_coins": 10000,
        "price_gems": 200,
        "preview_url": "border-amber-300 ring-2 ring-purple-500 shadow-[0_0_25px_rgba(251,191,36,0.7)]",
        "asset_data": "border-2 border-amber-300 ring-4 ring-purple-500/50 shadow-[0_0_25px_rgba(251,191,36,0.7)]",
        "description": "A mythical crown of stellar light.",
        "is_default": False,
    },
    # Prestige Titles
    {
        "id": "title_rookie",
        "name": "Novice Collector",
        "type": CosmeticType.TITLE,
        "rarity": CosmeticRarity.COMMON,
        "price_coins": 0,
        "price_gems": 0,
        "preview_url": "text-slate-400",
        "asset_data": "text-slate-400 font-medium",
        "description": "Beginning your journey into the Nexus.",
        "is_default": True,
    },
    {
        "id": "title_card_shark",
        "name": "Card Shark",
        "type": CosmeticType.TITLE,
        "rarity": CosmeticRarity.RARE,
        "price_coins": 1500,
        "price_gems": 30,
        "preview_url": "text-cyan-400 font-bold",
        "asset_data": "text-cyan-400 font-bold uppercase tracking-wider",
        "description": "Quick hands and sharp eyes at the trading table.",
        "is_default": False,
    },
    {
        "id": "title_vault_master",
        "name": "Vault Master",
        "type": CosmeticType.TITLE,
        "rarity": CosmeticRarity.EPIC,
        "price_coins": 4000,
        "price_gems": 80,
        "preview_url": "text-purple-400 font-extrabold",
        "asset_data": "text-purple-400 font-extrabold uppercase tracking-widest",
        "description": "Keeper of ancient binders and legendary treasures.",
        "is_default": False,
    },
    {
        "id": "title_grandmaster",
        "name": "Nexus Grandmaster",
        "type": CosmeticType.TITLE,
        "rarity": CosmeticRarity.LEGENDARY,
        "price_coins": 8000,
        "price_gems": 160,
        "preview_url": "text-amber-300 font-black",
        "asset_data": "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-black uppercase tracking-widest",
        "description": "The pinnacle of prestige. Recognized across all dimensions.",
        "is_default": False,
    },
]


def ensure_default_cosmetics(db: Session):
    for item in DEFAULT_CATALOGUE:
        existing = db.query(CosmeticItem).filter(CosmeticItem.id == item["id"]).first()
        if not existing:
            db.add(CosmeticItem(**item))
    db.commit()


def _get_or_create_equipped(user_id: int, db: Session) -> UserEquippedCosmetics:
    equipped = db.query(UserEquippedCosmetics).filter(UserEquippedCosmetics.user_id == user_id).first()
    if not equipped:
        equipped = UserEquippedCosmetics(
            user_id=user_id,
            equipped_sleeve_id="sleeve_classic_obsidian",
            equipped_binder_theme_id="theme_classic_dark",
            equipped_playmat_id="mat_classic_felt",
            equipped_avatar_frame_id="frame_default",
            equipped_title_id="title_rookie",
        )
        db.add(equipped)
        db.commit()
        db.refresh(equipped)
    return equipped


@router.get("/shop", response_model=List[CosmeticItemOut])
def get_cosmetics_shop(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    ensure_default_cosmetics(db)
    items = db.query(CosmeticItem).all()

    owned_ids = set()
    equipped_ids = set()

    if current_user:
        # Default items are owned by everyone
        for item in items:
            if item.is_default:
                owned_ids.add(item.id)

        user_owned = db.query(UserCosmetic.cosmetic_id).filter(UserCosmetic.user_id == current_user.id).all()
        for (cid,) in user_owned:
            owned_ids.add(cid)

        equipped = _get_or_create_equipped(current_user.id, db)
        for slot_val in [
            equipped.equipped_sleeve_id,
            equipped.equipped_binder_theme_id,
            equipped.equipped_playmat_id,
            equipped.equipped_avatar_frame_id,
            equipped.equipped_title_id,
        ]:
            if slot_val:
                equipped_ids.add(slot_val)

    result = []
    for item in items:
        out = CosmeticItemOut(
            id=item.id,
            name=item.name,
            type=item.type,
            rarity=item.rarity,
            price_coins=item.price_coins,
            price_gems=item.price_gems,
            preview_url=item.preview_url,
            asset_data=item.asset_data,
            description=item.description,
            is_default=item.is_default,
            is_owned=(item.id in owned_ids) or item.is_default,
            is_equipped=item.id in equipped_ids,
        )
        result.append(out)

    return result


@router.get("/equipped", response_model=EquippedCosmeticsOut)
def get_my_equipped(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_default_cosmetics(db)
    eq = _get_or_create_equipped(current_user.id, db)
    return EquippedCosmeticsOut(
        sleeve=CosmeticItemOut.from_orm(eq.sleeve) if eq.sleeve else None,
        binder_theme=CosmeticItemOut.from_orm(eq.binder_theme) if eq.binder_theme else None,
        playmat=CosmeticItemOut.from_orm(eq.playmat) if eq.playmat else None,
        avatar_frame=CosmeticItemOut.from_orm(eq.avatar_frame) if eq.avatar_frame else None,
        title=CosmeticItemOut.from_orm(eq.title) if eq.title else None,
    )


@router.get("/equipped/{username}", response_model=EquippedCosmeticsOut)
def get_user_equipped(
    username: str,
    db: Session = Depends(get_db),
):
    ensure_default_cosmetics(db)
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Player not found")

    eq = _get_or_create_equipped(target.id, db)
    return EquippedCosmeticsOut(
        sleeve=CosmeticItemOut.from_orm(eq.sleeve) if eq.sleeve else None,
        binder_theme=CosmeticItemOut.from_orm(eq.binder_theme) if eq.binder_theme else None,
        playmat=CosmeticItemOut.from_orm(eq.playmat) if eq.playmat else None,
        avatar_frame=CosmeticItemOut.from_orm(eq.avatar_frame) if eq.avatar_frame else None,
        title=CosmeticItemOut.from_orm(eq.title) if eq.title else None,
    )


@router.post("/buy/{cosmetic_id}")
def buy_cosmetic(
    cosmetic_id: str,
    req: BuyCosmeticRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_default_cosmetics(db)
    item = db.query(CosmeticItem).filter(CosmeticItem.id == cosmetic_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cosmetic item not found")

    if item.is_default:
        raise HTTPException(status_code=400, detail="Default cosmetics are already unlocked for free")

    # Check already owned
    existing = (
        db.query(UserCosmetic)
        .filter(UserCosmetic.user_id == current_user.id, UserCosmetic.cosmetic_id == cosmetic_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already own this cosmetic item")

    # Check price & deduct currency
    if req.currency == "gems":
        if item.price_gems <= 0:
            raise HTTPException(status_code=400, detail="This item cannot be bought with gems")
        if current_user.gems < item.price_gems:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient gems: need {item.price_gems}, you have {current_user.gems}",
            )
        current_user.gems -= item.price_gems
        tx = Transaction(
            user_id=current_user.id,
            type="BUY_COSMETIC",
            amount=-item.price_gems,
            currency="gems",
            reference_id=item.id,
            description=f"Unlocked cosmetic: {item.name}",
        )
    else:
        if item.price_coins <= 0:
            raise HTTPException(status_code=400, detail="This item cannot be bought with coins")
        if current_user.coins < item.price_coins:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient coins: need {item.price_coins:,}, you have {current_user.coins:,}",
            )
        current_user.coins -= item.price_coins
        tx = Transaction(
            user_id=current_user.id,
            type="BUY_COSMETIC",
            amount=-item.price_coins,
            currency="coins",
            reference_id=item.id,
            description=f"Unlocked cosmetic: {item.name}",
        )

    db.add(tx)
    new_owned = UserCosmetic(user_id=current_user.id, cosmetic_id=item.id)
    db.add(new_owned)
    db.commit()

    return {
        "success": True,
        "cosmetic_id": item.id,
        "name": item.name,
        "remaining_coins": current_user.coins,
        "remaining_gems": current_user.gems,
    }


@router.post("/equip", response_model=EquippedCosmeticsOut)
def equip_cosmetic(
    req: EquipRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_default_cosmetics(db)
    equipped = _get_or_create_equipped(current_user.id, db)

    target_id = req.cosmetic_id
    if target_id is not None:
        item = db.query(CosmeticItem).filter(CosmeticItem.id == target_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Cosmetic item not found")

        # Validate ownership
        if not item.is_default:
            owned = (
                db.query(UserCosmetic)
                .filter(UserCosmetic.user_id == current_user.id, UserCosmetic.cosmetic_id == target_id)
                .first()
            )
            if not owned:
                raise HTTPException(status_code=403, detail="You do not own this cosmetic item")

        # Match slot with type
        slot_map = {
            "sleeve": CosmeticType.SLEEVE,
            "binder_theme": CosmeticType.BINDER_THEME,
            "playmat": CosmeticType.PLAYMAT,
            "avatar_frame": CosmeticType.AVATAR_FRAME,
            "title": CosmeticType.TITLE,
        }
        if req.slot not in slot_map or item.type != slot_map[req.slot]:
            raise HTTPException(status_code=400, detail=f"Cosmetic type mismatch for slot '{req.slot}'")

    if req.slot == "sleeve":
        equipped.equipped_sleeve_id = target_id
    elif req.slot == "binder_theme":
        equipped.equipped_binder_theme_id = target_id
    elif req.slot == "playmat":
        equipped.equipped_playmat_id = target_id
    elif req.slot == "avatar_frame":
        equipped.equipped_avatar_frame_id = target_id
    elif req.slot == "title":
        equipped.equipped_title_id = target_id
    else:
        raise HTTPException(status_code=400, detail=f"Invalid slot '{req.slot}'")

    db.commit()
    db.refresh(equipped)

    return EquippedCosmeticsOut(
        sleeve=CosmeticItemOut.from_orm(equipped.sleeve) if equipped.sleeve else None,
        binder_theme=CosmeticItemOut.from_orm(equipped.binder_theme) if equipped.binder_theme else None,
        playmat=CosmeticItemOut.from_orm(equipped.playmat) if equipped.playmat else None,
        avatar_frame=CosmeticItemOut.from_orm(equipped.avatar_frame) if equipped.avatar_frame else None,
        title=CosmeticItemOut.from_orm(equipped.title) if equipped.title else None,
    )
