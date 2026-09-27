import uuid
import random
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.user_card import UserCard
from app.models.card import Card
from app.models.pack import Transaction
from app.models.battle import Deck, BattleHistory
from app.schemas.battle import (
    GymLeaderOut, BattleStartIn, BattleStateOut, BattleCardState,
    BattleActionIn, BattleSimulateIn, BattleSimulateOut, BattleHistoryOut
)

router = APIRouter()

# In-memory storage for active interactive battles
ACTIVE_BATTLES: Dict[str, Dict[str, Any]] = {}

GYM_LEADERS: Dict[str, Dict[str, Any]] = {
    "gym_pewter": {
        "id": "gym_pewter",
        "name": "Brock",
        "title": "The Rock-Solid Pokémon Trainer",
        "badge_name": "Boulder Badge",
        "badge_icon": "🪨",
        "difficulty": "Beginner",
        "avatar_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/brock.png",
        "recommended_level": 1,
        "element_type": "Fighting",
        "reward_coins": 350,
        "reward_xp": 250,
        "team": [
            {
                "card_id": "gym-geodude",
                "name": "Geodude",
                "image_url": "https://assets.tcgdex.net/en/base/base1/50/high.webp",
                "types": "Fighting",
                "hp": 60,
                "basic_atk": ("Tackle", 20),
                "special_atk": ("Rock Throw", 35),
            },
            {
                "card_id": "gym-onix",
                "name": "Onix",
                "image_url": "https://assets.tcgdex.net/en/base/base1/56/high.webp",
                "types": "Fighting",
                "hp": 90,
                "basic_atk": ("Rock Throw", 25),
                "special_atk": ("Rock Slide", 45),
            },
        ],
    },
    "gym_cerulean": {
        "id": "gym_cerulean",
        "name": "Misty",
        "title": "The Tomboyish Mermaid",
        "badge_name": "Cascade Badge",
        "badge_icon": "💧",
        "difficulty": "Intermediate",
        "avatar_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/misty.png",
        "recommended_level": 5,
        "element_type": "Water",
        "reward_coins": 750,
        "reward_xp": 500,
        "team": [
            {
                "card_id": "gym-staryu",
                "name": "Staryu",
                "image_url": "https://assets.tcgdex.net/en/base/base1/65/high.webp",
                "types": "Water",
                "hp": 60,
                "basic_atk": ("Tackle", 20),
                "special_atk": ("Water Gun", 40),
            },
            {
                "card_id": "gym-starmie",
                "name": "Starmie",
                "image_url": "https://assets.tcgdex.net/en/base/base1/64/high.webp",
                "types": "Water",
                "hp": 80,
                "basic_atk": ("Bubblebeam", 35),
                "special_atk": ("Hydro Pump", 55),
            },
            {
                "card_id": "gym-blastoise",
                "name": "Blastoise",
                "image_url": "https://assets.tcgdex.net/en/base/base1/2/high.webp",
                "types": "Water",
                "hp": 100,
                "basic_atk": ("Water Gun", 40),
                "special_atk": ("Hydro Pump", 70),
            },
        ],
    },
    "gym_vermilion": {
        "id": "gym_vermilion",
        "name": "Lt. Surge",
        "title": "The Lightning American",
        "badge_name": "Thunder Badge",
        "badge_icon": "⚡",
        "difficulty": "Advanced",
        "avatar_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/surge.png",
        "recommended_level": 10,
        "element_type": "Lightning",
        "reward_coins": 1400,
        "reward_xp": 850,
        "team": [
            {
                "card_id": "gym-voltorb",
                "name": "Voltorb",
                "image_url": "https://assets.tcgdex.net/en/base/base1/67/high.webp",
                "types": "Lightning",
                "hp": 60,
                "basic_atk": ("Tackle", 25),
                "special_atk": ("Self-Destruct", 50),
            },
            {
                "card_id": "gym-electabuzz",
                "name": "Electabuzz",
                "image_url": "https://assets.tcgdex.net/en/base/base1/20/high.webp",
                "types": "Lightning",
                "hp": 80,
                "basic_atk": ("Thunder Punch", 40),
                "special_atk": ("Thunderbolt", 60),
            },
            {
                "card_id": "gym-raichu",
                "name": "Raichu",
                "image_url": "https://assets.tcgdex.net/en/base/base1/14/high.webp",
                "types": "Lightning",
                "hp": 90,
                "basic_atk": ("Quick Attack", 35),
                "special_atk": ("Thunder", 75),
            },
        ],
    },
    "gym_viridian": {
        "id": "gym_viridian",
        "name": "Giovanni",
        "title": "Leader of Team Rocket",
        "badge_name": "Earth Badge",
        "badge_icon": "🌍",
        "difficulty": "Master",
        "avatar_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/giovanni.png",
        "recommended_level": 15,
        "element_type": "Fighting",
        "reward_coins": 2500,
        "reward_xp": 1500,
        "team": [
            {
                "card_id": "gym-dugtrio",
                "name": "Dugtrio",
                "image_url": "https://assets.tcgdex.net/en/base/base1/19/high.webp",
                "types": "Fighting",
                "hp": 70,
                "basic_atk": ("Slash", 35),
                "special_atk": ("Earthquake", 65),
            },
            {
                "card_id": "gym-nidoking",
                "name": "Nidoking",
                "image_url": "https://assets.tcgdex.net/en/base/base1/11/high.webp",
                "types": "Fighting",
                "hp": 90,
                "basic_atk": ("Thrash", 45),
                "special_atk": ("Toxic Spikes", 70),
            },
            {
                "card_id": "gym-mewtwo",
                "name": "Mewtwo",
                "image_url": "https://assets.tcgdex.net/en/base/base1/10/high.webp",
                "types": "Psychic",
                "hp": 120,
                "basic_atk": ("Psychic", 50),
                "special_atk": ("Psystrike", 90),
            },
        ],
    },
}

TYPE_WEAKNESS = {
    ("Fire", "Grass"): 2.0,
    ("Fire", "Water"): 0.5,
    ("Water", "Fire"): 2.0,
    ("Water", "Lightning"): 0.5,
    ("Water", "Grass"): 0.5,
    ("Grass", "Water"): 2.0,
    ("Grass", "Fire"): 0.5,
    ("Lightning", "Water"): 2.0,
    ("Lightning", "Fighting"): 0.5,
    ("Fighting", "Lightning"): 2.0,
    ("Fighting", "Normal"): 1.5,
    ("Fighting", "Psychic"): 0.5,
    ("Psychic", "Fighting"): 2.0,
}


def _calc_multiplier(atk_type: str, def_type: str) -> float:
    return TYPE_WEAKNESS.get((atk_type, def_type), 1.0)


def _card_to_battle_state(c: Card, hp_mult: float = 1.0) -> BattleCardState:
    base_hp = int((c.hp or 60) * hp_mult)
    t = c.types or "Normal"
    
    # Generate authentic sounding attacks
    basic_dmg = max(20, base_hp // 3)
    spec_dmg = max(35, int(base_hp * 0.6))
    
    spec_names = {
        "Fire": "Flamethrower",
        "Water": "Hydro Pump",
        "Grass": "Solar Beam",
        "Lightning": "Thunderbolt",
        "Psychic": "Psychic Blast",
        "Fighting": "Cross Chop",
        "Normal": "Hyper Beam",
    }
    spec_name = spec_names.get(t, "Special Surge")

    return BattleCardState(
        card_id=c.id,
        name=c.name,
        image_url=c.image_url,
        types=t,
        max_hp=base_hp,
        current_hp=base_hp,
        basic_atk_name="Quick Attack" if t == "Normal" else f"{t} Strike",
        basic_atk_dmg=basic_dmg,
        special_atk_name=spec_name,
        special_atk_dmg=spec_dmg,
        energy=1,
    )


def _get_player_battle_team(user_id: int, deck_id: Optional[int], db: Session) -> List[BattleCardState]:
    # 1. Try provided deck
    deck = None
    if deck_id:
        deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user_id).first()
    # 2. Try active deck
    if not deck:
        deck = db.query(Deck).filter(Deck.user_id == user_id, Deck.is_active == True).first()
    # 3. If deck has cards, load them
    team: List[BattleCardState] = []
    if deck and deck.cards:
        for dc in deck.cards:
            if dc.card:
                for _ in range(min(dc.quantity, 2)):  # take up to 2 copies for battle
                    team.append(_card_to_battle_state(dc.card))
                    if len(team) >= 4:
                        break
            if len(team) >= 4:
                break

    # 4. Fallback: Take top 3 highest HP cards from collection
    if not team:
        user_cards = (
            db.query(UserCard)
            .filter(UserCard.user_id == user_id, UserCard.quantity > 0)
            .all()
        )
        sorted_cards = sorted(
            [uc.card for uc in user_cards if uc.card],
            key=lambda c: c.hp or 0,
            reverse=True,
        )[:3]
        for c in sorted_cards:
            team.append(_card_to_battle_state(c))

    # 5. Ultimate fallback if empty collection: Starter Pikachu & Charmander
    if not team:
        starter = db.query(Card).filter(Card.name.in_(["Pikachu", "Charmander", "Squirtle"])).all()
        for c in starter:
            team.append(_card_to_battle_state(c))

    return team if team else [
        BattleCardState(
            card_id="fallback-pika",
            name="Pikachu",
            image_url="https://assets.tcgdex.net/en/base/base1/58/high.webp",
            types="Lightning",
            max_hp=60,
            current_hp=60,
            basic_atk_name="Thunder Shock",
            basic_atk_dmg=25,
            special_atk_name="Thunderbolt",
            special_atk_dmg=45,
            energy=1,
        )
    ]


@router.get("/gyms", response_model=List[GymLeaderOut])
def get_gym_leaders():
    out = []
    for g in GYM_LEADERS.values():
        out.append(
            GymLeaderOut(
                id=g["id"],
                name=g["name"],
                title=g["title"],
                badge_name=g["badge_name"],
                badge_icon=g["badge_icon"],
                difficulty=g["difficulty"],
                avatar_url=g["avatar_url"],
                recommended_level=g["recommended_level"],
                element_type=g["element_type"],
                reward_coins=g["reward_coins"],
                reward_xp=g["reward_xp"],
                team_preview=[p["name"] for p in g["team"]],
            )
        )
    return out


@router.get("/history", response_model=List[BattleHistoryOut])
def get_battle_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    history = (
        db.query(BattleHistory)
        .filter(BattleHistory.user_id == current_user.id)
        .order_by(BattleHistory.created_at.desc())
        .limit(20)
        .all()
    )
    return history


@router.post("/simulate", response_model=BattleSimulateOut)
def simulate_battle(
    payload: BattleSimulateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = GYM_LEADERS.get(payload.gym_id)
    if not gym:
        raise HTTPException(status_code=404, detail="Gym Leader not found")

    player_team = _get_player_battle_team(current_user.id, payload.deck_id, db)
    opp_team = [
        BattleCardState(
            card_id=t["card_id"],
            name=t["name"],
            image_url=t["image_url"],
            types=t["types"],
            max_hp=t["hp"],
            current_hp=t["hp"],
            basic_atk_name=t["basic_atk"][0],
            basic_atk_dmg=t["basic_atk"][1],
            special_atk_name=t["special_atk"][0],
            special_atk_dmg=t["special_atk"][1],
            energy=1,
        )
        for t in gym["team"]
    ]

    logs: List[str] = [
        f"Battle Commenced! Challenger {current_user.username} vs Gym Leader {gym['name']} ({gym['title']})!",
        f"{current_user.username} sent out {player_team[0].name} (HP: {player_team[0].current_hp})!",
        f"Leader {gym['name']} sent out {opp_team[0].name} (HP: {opp_team[0].current_hp})!",
    ]

    p_idx = 0
    o_idx = 0
    turn = 0
    max_turns = 30

    while p_idx < len(player_team) and o_idx < len(opp_team) and turn < max_turns:
        turn += 1
        p_card = player_team[p_idx]
        o_card = opp_team[o_idx]

        # Player Action
        mult_p = _calc_multiplier(p_card.types, o_card.types)
        use_special_p = p_card.energy >= 1 and random.random() > 0.35
        if use_special_p:
            atk_name_p = p_card.special_atk_name
            raw_dmg_p = p_card.special_atk_dmg
            p_card.energy = 0
        else:
            atk_name_p = p_card.basic_atk_name
            raw_dmg_p = p_card.basic_atk_dmg
            p_card.energy += 1

        dmg_p = int(raw_dmg_p * mult_p * random.uniform(0.85, 1.15))
        o_card.current_hp = max(0, o_card.current_hp - dmg_p)
        eff_str_p = " (It's SUPER effective!)" if mult_p > 1.2 else (" (Not very effective...)" if mult_p < 0.8 else "")
        logs.append(f"Turn {turn} - {p_card.name} used {atk_name_p} for {dmg_p} damage!{eff_str_p}")

        if o_card.current_hp <= 0:
            logs.append(f"Leader {gym['name']}'s {o_card.name} fainted!")
            o_idx += 1
            if o_idx < len(opp_team):
                next_o = opp_team[o_idx]
                logs.append(f"Leader {gym['name']} sent out {next_o.name} (HP: {next_o.current_hp})!")
            continue

        # Opponent Action
        mult_o = _calc_multiplier(o_card.types, p_card.types)
        use_special_o = o_card.energy >= 1 and random.random() > 0.40
        if use_special_o:
            atk_name_o = o_card.special_atk_name
            raw_dmg_o = o_card.special_atk_dmg
            o_card.energy = 0
        else:
            atk_name_o = o_card.basic_atk_name
            raw_dmg_o = o_card.basic_atk_dmg
            o_card.energy += 1

        dmg_o = int(raw_dmg_o * mult_o * random.uniform(0.85, 1.15))
        p_card.current_hp = max(0, p_card.current_hp - dmg_o)
        eff_str_o = " (It's SUPER effective!)" if mult_o > 1.2 else (" (Not very effective...)" if mult_o < 0.8 else "")
        logs.append(f"Turn {turn} - Enemy {o_card.name} counter-attacked with {atk_name_o} for {dmg_o} damage!{eff_str_o}")

        if p_card.current_hp <= 0:
            logs.append(f"{current_user.username}'s {p_card.name} fainted!")
            p_idx += 1
            if p_idx < len(player_team):
                next_p = player_team[p_idx]
                logs.append(f"{current_user.username} sent out {next_p.name} (HP: {next_p.current_hp})!")

    # Check Winner
    won = (o_idx >= len(opp_team))
    result = "win" if won else "loss"

    reward_coins = gym["reward_coins"] if won else int(gym["reward_coins"] * 0.15)
    reward_xp = gym["reward_xp"] if won else int(gym["reward_xp"] * 0.20)

    # Apply Rewards
    current_user.coins += reward_coins
    current_user.xp += reward_xp
    # Check level up (every 1000 XP)
    new_level = max(1, 1 + (current_user.xp // 1000))
    if new_level > current_user.level:
        current_user.level = new_level
        logs.append(f"LEVEL UP! {current_user.username} reached Level {new_level}!")

    # Record Economy Transaction
    tx = Transaction(
        user_id=current_user.id,
        amount=reward_coins,
        currency="coins",
        type="battle_reward",
        description=f"Gym Battle {'Victory' if won else 'Participation'}: {gym['name']} ({gym['badge_name']})",
    )
    db.add(tx)

    # Record Battle History
    bh = BattleHistory(
        user_id=current_user.id,
        gym_id=gym["id"],
        gym_leader_name=gym["name"],
        result=result,
        turns_played=turn,
        reward_coins=reward_coins,
        reward_xp=reward_xp,
    )
    db.add(bh)
    db.commit()

    if won:
        logs.append(f"VICTORY! You defeated Gym Leader {gym['name']} and earned the {gym['badge_name']}! (+{reward_coins} Coins, +{reward_xp} XP)")
    else:
        logs.append(f"DEFEAT! All your Pokémon fainted. Consolation prize: +{reward_coins} Coins, +{reward_xp} XP.")

    return BattleSimulateOut(
        gym_id=gym["id"],
        gym_leader_name=gym["name"],
        badge_name=gym["badge_name"],
        result=result,
        turns=turn,
        logs=logs,
        reward_coins=reward_coins,
        reward_xp=reward_xp,
        player_cards_used=[p.name for p in player_team],
        opponent_cards_used=[o.name for o in opp_team],
    )


@router.post("/start", response_model=BattleStateOut)
def start_interactive_battle(
    payload: BattleStartIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = GYM_LEADERS.get(payload.gym_id)
    if not gym:
        raise HTTPException(status_code=404, detail="Gym Leader not found")

    player_team = _get_player_battle_team(current_user.id, payload.deck_id, db)
    opp_team = [
        BattleCardState(
            card_id=t["card_id"],
            name=t["name"],
            image_url=t["image_url"],
            types=t["types"],
            max_hp=t["hp"],
            current_hp=t["hp"],
            basic_atk_name=t["basic_atk"][0],
            basic_atk_dmg=t["basic_atk"][1],
            special_atk_name=t["special_atk"][0],
            special_atk_dmg=t["special_atk"][1],
            energy=1,
        )
        for t in gym["team"]
    ]

    battle_id = str(uuid.uuid4())
    state = {
        "battle_id": battle_id,
        "user_id": current_user.id,
        "gym_id": gym["id"],
        "gym_name": gym["name"],
        "badge_name": gym["badge_name"],
        "turn": 1,
        "player_active": player_team[0],
        "player_bench": player_team[1:],
        "opponent_active": opp_team[0],
        "opponent_bench": opp_team[1:],
        "is_over": False,
        "winner": None,
        "reward_coins": 0,
        "reward_xp": 0,
        "logs": [
            f"Duel Initiated! {current_user.username} challenges Gym Leader {gym['name']}!",
            f"Go! {player_team[0].name} (HP: {player_team[0].current_hp})!",
            f"Leader {gym['name']} sends out {opp_team[0].name} (HP: {opp_team[0].current_hp})!",
        ],
    }
    ACTIVE_BATTLES[battle_id] = state

    return BattleStateOut(**state)


@router.post("/{battle_id}/action", response_model=BattleStateOut)
def battle_action(
    battle_id: str,
    payload: BattleActionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = ACTIVE_BATTLES.get(battle_id)
    if not b:
        raise HTTPException(status_code=404, detail="Active battle session not found")
    if b["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized battle session")
    if b["is_over"]:
        return BattleStateOut(**b)

    gym = GYM_LEADERS[b["gym_id"]]
    p_card: BattleCardState = b["player_active"]
    o_card: BattleCardState = b["opponent_active"]
    b["turn"] += 1
    new_logs = []

    # Handle Switch Action
    if payload.action == "switch" and payload.switch_idx is not None:
        if 0 <= payload.switch_idx < len(b["player_bench"]):
            bench_card = b["player_bench"].pop(payload.switch_idx)
            old_card = b["player_active"]
            b["player_bench"].append(old_card)
            b["player_active"] = bench_card
            p_card = bench_card
            new_logs.append(f"Turn {b['turn']}: Switched active Pokémon to {p_card.name}!")
        else:
            raise HTTPException(status_code=400, detail="Invalid bench index")

    # Handle Charge Action
    elif payload.action == "charge":
        p_card.energy += 2
        new_logs.append(f"Turn {b['turn']}: {p_card.name} charged energy (+2 Energy) and assumed defensive stance!")

    # Handle Attack / Special Attack
    elif payload.action in ["attack", "special"]:
        mult_p = _calc_multiplier(p_card.types, o_card.types)
        if payload.action == "special":
            if p_card.energy < 1:
                raise HTTPException(status_code=400, detail="Not enough energy for Special Move")
            p_card.energy -= 1
            dmg_p = int(p_card.special_atk_dmg * mult_p * random.uniform(0.9, 1.15))
            atk_name = p_card.special_atk_name
        else:
            p_card.energy += 1
            dmg_p = int(p_card.basic_atk_dmg * mult_p * random.uniform(0.9, 1.1))
            atk_name = p_card.basic_atk_name

        o_card.current_hp = max(0, o_card.current_hp - dmg_p)
        eff_str = " (SUPER EFFECTIVE!)" if mult_p > 1.2 else (" (Not very effective)" if mult_p < 0.8 else "")
        new_logs.append(f"Turn {b['turn']}: {p_card.name} used {atk_name} for {dmg_p} damage!{eff_str}")

    # Check if Opponent Active Pokémon Fainted
    if o_card.current_hp <= 0:
        new_logs.append(f"Leader {gym['name']}'s {o_card.name} fainted!")
        if len(b["opponent_bench"]) > 0:
            b["opponent_active"] = b["opponent_bench"].pop(0)
            o_card = b["opponent_active"]
            new_logs.append(f"Leader {gym['name']} brings out {o_card.name} (HP: {o_card.current_hp})!")
        else:
            # Player Won!
            b["is_over"] = True
            b["winner"] = "player"
            b["reward_coins"] = gym["reward_coins"]
            b["reward_xp"] = gym["reward_xp"]
            current_user.coins += gym["reward_coins"]
            current_user.xp += gym["reward_xp"]
            new_logs.append(f"🏆 VICTORY! You defeated Gym Leader {gym['name']} and earned the {gym['badge_name']}! (+{gym['reward_coins']} Coins, +{gym['reward_xp']} XP)")

            # Record Battle
            bh = BattleHistory(
                user_id=current_user.id,
                gym_id=gym["id"],
                gym_leader_name=gym["name"],
                result="win",
                turns_played=b["turn"],
                reward_coins=gym["reward_coins"],
                reward_xp=gym["reward_xp"],
            )
            db.add(bh)
            db.commit()
            b["logs"].extend(new_logs)
            return BattleStateOut(**b)

    # Opponent Counter Turn
    mult_o = _calc_multiplier(o_card.types, p_card.types)
    use_spec_o = o_card.energy >= 1 and random.random() > 0.4
    if use_spec_o:
        o_card.energy -= 1
        dmg_o = int(o_card.special_atk_dmg * mult_o * random.uniform(0.9, 1.1))
        atk_name_o = o_card.special_atk_name
    else:
        o_card.energy += 1
        dmg_o = int(o_card.basic_atk_dmg * mult_o * random.uniform(0.9, 1.1))
        atk_name_o = o_card.basic_atk_name

    p_card.current_hp = max(0, p_card.current_hp - dmg_o)
    eff_str_o = " (SUPER EFFECTIVE!)" if mult_o > 1.2 else (" (Not very effective)" if mult_o < 0.8 else "")
    new_logs.append(f"Opponent {o_card.name} struck back with {atk_name_o} for {dmg_o} damage!{eff_str_o}")

    # Check if Player Active Pokémon Fainted
    if p_card.current_hp <= 0:
        new_logs.append(f"Your {p_card.name} fainted!")
        if len(b["player_bench"]) > 0:
            b["player_active"] = b["player_bench"].pop(0)
            p_card = b["player_active"]
            new_logs.append(f"Go! {p_card.name} steps onto the battlefield!")
        else:
            # Player Defeat
            b["is_over"] = True
            b["winner"] = "opponent"
            consol_coins = int(gym["reward_coins"] * 0.15)
            consol_xp = int(gym["reward_xp"] * 0.20)
            b["reward_coins"] = consol_coins
            b["reward_xp"] = consol_xp
            current_user.coins += consol_coins
            current_user.xp += consol_xp
            new_logs.append(f"💀 DEFEAT! All your Pokémon fainted. Consolation: +{consol_coins} Coins, +{consol_xp} XP.")

            bh = BattleHistory(
                user_id=current_user.id,
                gym_id=gym["id"],
                gym_leader_name=gym["name"],
                result="loss",
                turns_played=b["turn"],
                reward_coins=consol_coins,
                reward_xp=consol_xp,
            )
            db.add(bh)
            db.commit()

    b["logs"].extend(new_logs)
    return BattleStateOut(**b)
