import json
import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.pack import Transaction, PlayerPack
from app.models.battle import Deck
from app.models.tournament import Tournament, TournamentParticipant, TournamentMatch
from app.schemas.tournament import (
    TournamentOut,
    TournamentDetailOut,
    TournamentParticipantOut,
    TournamentMatchOut,
    TournamentSpectateMatchOut,
    TournamentJoinIn,
    TournamentPlayMatchIn,
    TournamentMatchResultOut,
)


router = APIRouter()


def utc_now():
    return datetime.now(timezone.utc)


DEFAULT_TOURNAMENTS = [
    {
        "id": "tourney_indigo",
        "name": "Indigo Plateau Championship",
        "description": "The pinnacle of competitive Pokémon TCG! High-stakes 8-master bracket for ultimate glory.",
        "tier": "gold",
        "entry_fee_coins": 1500,
        "reward_coins": 10000,
        "reward_gems": 250,
        "reward_pack_id": "pack_team_rocket",
        "banner_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=800",
    },
    {
        "id": "tourney_silph",
        "name": "Silph Co. Invitational",
        "description": "Corporate sponsored masterclass tournament featuring elite regional competitors.",
        "tier": "silver",
        "entry_fee_coins": 500,
        "reward_coins": 3500,
        "reward_gems": 100,
        "reward_pack_id": "pack_fossil",
        "banner_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
    },
    {
        "id": "tourney_rocket",
        "name": "Rocket Underground Showdown",
        "description": "No-holds-barred underground skirmish. Free entry with fast-paced elimination duels.",
        "tier": "bronze",
        "entry_fee_coins": 0,
        "reward_coins": 1200,
        "reward_gems": 50,
        "reward_pack_id": "pack_jungle",
        "banner_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    },
]

AI_CONTENDERS = [
    {"name": "Lance", "avatar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/lance.png", "deck": "Dragonite Cataclysm", "arch": "Dragon/Electric"},
    {"name": "Blue", "avatar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/blue.png", "deck": "Grandmaster All-Stars", "arch": "Water/Fire"},
    {"name": "Steven Stone", "avatar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/steven.png", "deck": "Metagross Steel Aegis", "arch": "Psychic/Fighting"},
    {"name": "Cynthia", "avatar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/cynthia.png", "deck": "Garchomp Quake", "arch": "Fighting/Dark"},
    {"name": "Lorelei", "avatar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/lorelei.png", "deck": "Glacial Torrent", "arch": "Water/Psychic"},
    {"name": "Bruno", "avatar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/bruno.png", "deck": "Machamp Seismic Slam", "arch": "Fighting"},
    {"name": "Agatha", "avatar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/agatha.png", "deck": "Gengar Shadow Curse", "arch": "Psychic/Poison"},
]


def ensure_tournaments(db: Session):
    for t_data in DEFAULT_TOURNAMENTS:
        t = db.query(Tournament).filter(Tournament.id == t_data["id"]).first()
        if not t:
            t = Tournament(
                id=t_data["id"],
                name=t_data["name"],
                description=t_data["description"],
                tier=t_data["tier"],
                entry_fee_coins=t_data["entry_fee_coins"],
                reward_coins=t_data["reward_coins"],
                reward_gems=t_data["reward_gems"],
                reward_pack_id=t_data["reward_pack_id"],
                banner_url=t_data["banner_url"],
            )
            db.add(t)
    db.commit()


def _get_user_status(t: Tournament, user_id: int):
    part = next((p for p in t.participants if p.user_id == user_id), None)
    if not part:
        return None, "not_joined"
    if t.winner_id == user_id:
        return part.id, "champion"
    if part.eliminated:
        return part.id, "eliminated"
    return part.id, "active"


def _format_match_out(m: TournamentMatch) -> TournamentMatchOut:
    return TournamentMatchOut(
        id=m.id,
        round_number=m.round_number,
        match_index=m.match_index,
        participant1=TournamentParticipantOut.model_validate(m.p1) if m.p1 else None,
        participant2=TournamentParticipantOut.model_validate(m.p2) if m.p2 else None,
        winner=TournamentParticipantOut.model_validate(m.winner) if m.winner else None,
        p1_score=m.p1_score,
        p2_score=m.p2_score,
        status=m.status,
        completed_at=m.completed_at,
    )


def _simulate_combat(p1_name: str, p2_name: str, is_user_p1: bool = False, is_user_p2: bool = False) -> (int, int, List[str]):
    """Simulate a dynamic 3-turn Pokémon card duel."""
    logs = [f"Round bell rings! {p1_name} steps onto the championship battlefield against {p2_name}."]
    p1_hp = 120
    p2_hp = 120
    turn = 1

    moves_pool = [
        ("Flamethrower", 45), ("Hydro Pump", 40), ("Thunderbolt", 50),
        ("Hyper Beam", 60), ("Psychic Blast", 45), ("Dragon Claw", 40),
        ("Earthquake", 55), ("Shadow Ball", 35)
    ]

    while p1_hp > 0 and p2_hp > 0 and turn <= 6:
        # P1 Attacks P2
        mv1, dmg1 = random.choice(moves_pool)
        # Slight player boost if user is fighting
        if is_user_p1:
            dmg1 = int(dmg1 * 1.25)
        elif is_user_p2:
            dmg1 = int(dmg1 * 0.85)

        p2_hp = max(0, p2_hp - dmg1)
        logs.append(f"Turn {turn}: {p1_name} commands {mv1}! Deals {dmg1} damage ({p2_name} HP: {p2_hp}/120).")

        if p2_hp <= 0:
            logs.append(f"K.O.! {p2_name}'s Pokémon collapsed! {p1_name} claims the match victory!")
            return 2, 0, logs

        # P2 Attacks P1
        mv2, dmg2 = random.choice(moves_pool)
        if is_user_p2:
            dmg2 = int(dmg2 * 1.25)
        elif is_user_p1:
            dmg2 = int(dmg2 * 0.85)

        p1_hp = max(0, p1_hp - dmg2)
        logs.append(f"Turn {turn}: {p2_name} counter-attacks with {mv2}! Deals {dmg2} damage ({p1_name} HP: {p1_hp}/120).")

        if p1_hp <= 0:
            logs.append(f"K.O.! {p1_name}'s Pokémon collapsed! {p2_name} claims the match victory!")
            return 0, 2, logs

        turn += 1

    # Tie break
    if p1_hp >= p2_hp:
        logs.append(f"Time limit reached! {p1_name} takes the decision victory by remaining HP ({p1_hp} vs {p2_hp})!")
        return 2, 1, logs
    else:
        logs.append(f"Time limit reached! {p2_name} takes the decision victory by remaining HP ({p2_hp} vs {p1_hp})!")
        return 1, 2, logs


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

@router.get("", response_model=List[TournamentOut])
def get_tournaments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_tournaments(db)
    tournaments = db.query(Tournament).options(joinedload(Tournament.participants)).all()
    results = []
    for t in tournaments:
        pid, u_status = _get_user_status(t, current_user.id)
        winner_name = t.winner.username if t.winner else None
        results.append(
            TournamentOut(
                id=t.id,
                name=t.name,
                description=t.description,
                tier=t.tier,
                entry_fee_coins=t.entry_fee_coins,
                reward_coins=t.reward_coins,
                reward_gems=t.reward_gems,
                reward_pack_id=t.reward_pack_id,
                banner_url=t.banner_url,
                status=t.status,
                rounds_total=t.rounds_total,
                current_round=t.current_round,
                winner_name=winner_name,
                user_participant_id=pid,
                user_status=u_status,
            )
        )
    return results


@router.get("/{tournament_id}", response_model=TournamentDetailOut)
def get_tournament_detail(
    tournament_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_tournaments(db)
    t = (
        db.query(Tournament)
        .options(
            joinedload(Tournament.participants),
            joinedload(Tournament.matches).joinedload(TournamentMatch.p1),
            joinedload(Tournament.matches).joinedload(TournamentMatch.p2),
            joinedload(Tournament.matches).joinedload(TournamentMatch.winner),
        )
        .filter(Tournament.id == tournament_id)
        .first()
    )
    if not t:
        raise HTTPException(404, "Tournament not found")

    pid, u_status = _get_user_status(t, current_user.id)
    winner_name = t.winner.username if t.winner else None

    # Sort matches by round_number, match_index
    sorted_matches = sorted(t.matches, key=lambda m: (m.round_number, m.match_index))

    return TournamentDetailOut(
        id=t.id,
        name=t.name,
        description=t.description,
        tier=t.tier,
        entry_fee_coins=t.entry_fee_coins,
        reward_coins=t.reward_coins,
        reward_gems=t.reward_gems,
        reward_pack_id=t.reward_pack_id,
        banner_url=t.banner_url,
        status=t.status,
        rounds_total=t.rounds_total,
        current_round=t.current_round,
        winner_name=winner_name,
        user_participant_id=pid,
        user_status=u_status,
        participants=[TournamentParticipantOut.model_validate(p) for p in t.participants],
        matches=[_format_match_out(m) for m in sorted_matches],
    )


@router.post("/{tournament_id}/join", response_model=TournamentDetailOut)
def join_tournament(
    tournament_id: str,
    payload: TournamentJoinIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_tournaments(db)
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")

    # Check fee
    if current_user.coins < t.entry_fee_coins:
        raise HTTPException(
            400,
            f"Insufficient coins. Entry fee is {t.entry_fee_coins:,} coins (you have {current_user.coins:,})"
        )

    # Check active deck
    deck_name = "Player Squad"
    if payload.deck_id:
        deck = db.query(Deck).filter(Deck.id == payload.deck_id, Deck.user_id == current_user.id).first()
        if deck:
            deck_name = deck.name

    # Reset tournament participants and matches for a fresh bracket experience
    db.query(TournamentMatch).filter(TournamentMatch.tournament_id == t.id).delete()
    db.query(TournamentParticipant).filter(TournamentParticipant.tournament_id == t.id).delete()

    # Deduct coins
    if t.entry_fee_coins > 0:
        current_user.coins -= t.entry_fee_coins
        db.add(Transaction(
            user_id=current_user.id,
            type="TOURNAMENT_ENTRY",
            amount=-t.entry_fee_coins,
            currency="coins",
            reference_id=t.id,
            description=f"Entry fee for {t.name}",
        ))

    # Add User as Seed 1
    user_part = TournamentParticipant(
        tournament_id=t.id,
        user_id=current_user.id,
        display_name=current_user.username,
        avatar_url=current_user.avatar_url,
        seed=1,
        is_ai=False,
        active_deck_name=deck_name,
        deck_archetype="Custom Balanced",
    )
    db.add(user_part)
    db.flush()

    # Add 7 AI Contenders
    ai_parts = []
    shuffled_ai = list(AI_CONTENDERS)
    random.shuffle(shuffled_ai)

    for i, ai in enumerate(shuffled_ai):
        p = TournamentParticipant(
            tournament_id=t.id,
            display_name=ai["name"],
            avatar_url=ai["avatar"],
            seed=i + 2,
            is_ai=True,
            active_deck_name=ai["deck"],
            deck_archetype=ai["arch"],
        )
        db.add(p)
        ai_parts.append(p)

    db.flush()

    # Generate 8-bracket Quarterfinals:
    # Match 0: User (Seed 1) vs AI 0 (Seed 8)
    # Match 1: AI 1 vs AI 2
    # Match 2: AI 3 vs AI 4
    # Match 3: AI 5 vs AI 6
    all_qf_players = [user_part] + ai_parts

    qf_matches = [
        TournamentMatch(tournament_id=t.id, round_number=1, match_index=0, participant1_id=all_qf_players[0].id, participant2_id=all_qf_players[7].id, status="ready"),
        TournamentMatch(tournament_id=t.id, round_number=1, match_index=1, participant1_id=all_qf_players[1].id, participant2_id=all_qf_players[6].id, status="pending"),
        TournamentMatch(tournament_id=t.id, round_number=1, match_index=2, participant1_id=all_qf_players[2].id, participant2_id=all_qf_players[5].id, status="pending"),
        TournamentMatch(tournament_id=t.id, round_number=1, match_index=3, participant1_id=all_qf_players[3].id, participant2_id=all_qf_players[4].id, status="pending"),
    ]

    for m in qf_matches:
        db.add(m)

    # Placeholders for Semifinals (Round 2)
    sf0 = TournamentMatch(tournament_id=t.id, round_number=2, match_index=0, status="pending")
    sf1 = TournamentMatch(tournament_id=t.id, round_number=2, match_index=1, status="pending")
    db.add(sf0)
    db.add(sf1)

    # Placeholder for Grand Finals (Round 3)
    finals = TournamentMatch(tournament_id=t.id, round_number=3, match_index=0, status="pending")
    db.add(finals)

    # Simulate other 3 QF matches immediately
    for m in qf_matches[1:]:
        p1 = db.query(TournamentParticipant).filter(TournamentParticipant.id == m.participant1_id).first()
        p2 = db.query(TournamentParticipant).filter(TournamentParticipant.id == m.participant2_id).first()
        s1, s2, logs = _simulate_combat(p1.display_name, p2.display_name)
        m.p1_score = s1
        m.p2_score = s2
        m.battle_log = json.dumps(logs)
        m.status = "completed"
        m.completed_at = utc_now()
        winner = p1 if s1 > s2 else p2
        loser = p2 if s1 > s2 else p1
        m.winner_id = winner.id
        loser.eliminated = True
        loser.eliminated_in_round = 1

    # Advance QF match 2 and 3 winners to SF 1
    sf1.participant1_id = qf_matches[2].winner_id
    sf1.participant2_id = qf_matches[3].winner_id
    sf1.status = "pending"

    t.status = "active"
    t.current_round = 1
    t.winner_id = None
    db.commit()

    return get_tournament_detail(t.id, db, current_user)


@router.post("/{tournament_id}/play", response_model=TournamentMatchResultOut)
def play_tournament_match(
    tournament_id: str,
    payload: TournamentPlayMatchIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")

    user_part = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == t.id,
        TournamentParticipant.user_id == current_user.id
    ).first()
    if not user_part or user_part.eliminated:
        raise HTTPException(400, "You are not active in this tournament")

    # Find the user's ready match in the current round
    match = db.query(TournamentMatch).filter(
        TournamentMatch.tournament_id == t.id,
        TournamentMatch.round_number == t.current_round,
        (TournamentMatch.participant1_id == user_part.id) | (TournamentMatch.participant2_id == user_part.id),
        TournamentMatch.status.in_(["ready", "pending"])
    ).first()

    if not match:
        raise HTTPException(400, f"No pending match for you in Round {t.current_round}")

    is_user_p1 = (match.participant1_id == user_part.id)
    opp_part_id = match.participant2_id if is_user_p1 else match.participant1_id
    opp_part = db.query(TournamentParticipant).filter(TournamentParticipant.id == opp_part_id).first()
    if not opp_part:
        raise HTTPException(400, "Opponent has not reached this match yet")

    # Simulate or play
    p1_name = user_part.display_name if is_user_p1 else opp_part.display_name
    p2_name = opp_part.display_name if is_user_p1 else user_part.display_name

    s1, s2, logs = _simulate_combat(p1_name, p2_name, is_user_p1=is_user_p1, is_user_p2=(not is_user_p1))
    match.p1_score = s1
    match.p2_score = s2
    match.battle_log = json.dumps(logs)
    match.status = "completed"
    match.completed_at = utc_now()

    user_won = (s1 > s2 and is_user_p1) or (s2 > s1 and not is_user_p1)
    winner = user_part if user_won else opp_part
    loser = opp_part if user_won else user_part

    match.winner_id = winner.id
    loser.eliminated = True
    loser.eliminated_in_round = t.current_round

    coins_reward = 0
    gems_reward = 0
    xp_reward = 150 * t.current_round
    pack_reward = None
    is_champion = False
    is_tournament_over = False
    next_match_id = None

    if not user_won:
        is_tournament_over = True
    else:
        # Advance user in the bracket
        if t.current_round == 1:
            # Advance to Semifinals (Round 2, Match 0)
            sf0 = db.query(TournamentMatch).filter(
                TournamentMatch.tournament_id == t.id,
                TournamentMatch.round_number == 2,
                TournamentMatch.match_index == 0
            ).first()

            qf1 = db.query(TournamentMatch).filter(TournamentMatch.tournament_id == t.id, TournamentMatch.round_number == 1, TournamentMatch.match_index == 1).first()

            sf0.participant1_id = user_part.id
            sf0.participant2_id = qf1.winner_id
            sf0.status = "ready"
            next_match_id = sf0.id
            t.current_round = 2

            # Also simulate SF 1 between other AI players
            sf1 = db.query(TournamentMatch).filter(TournamentMatch.tournament_id == t.id, TournamentMatch.round_number == 2, TournamentMatch.match_index == 1).first()
            p1_sf = db.query(TournamentParticipant).filter(TournamentParticipant.id == sf1.participant1_id).first()
            p2_sf = db.query(TournamentParticipant).filter(TournamentParticipant.id == sf1.participant2_id).first()
            s1_sf, s2_sf, logs_sf = _simulate_combat(p1_sf.display_name, p2_sf.display_name)
            sf1.p1_score = s1_sf
            sf1.p2_score = s2_sf
            sf1.battle_log = json.dumps(logs_sf)
            sf1.status = "completed"
            sf1.completed_at = utc_now()
            w_sf = p1_sf if s1_sf > s2_sf else p2_sf
            l_sf = p2_sf if s1_sf > s2_sf else p1_sf
            sf1.winner_id = w_sf.id
            l_sf.eliminated = True
            l_sf.eliminated_in_round = 2

        elif t.current_round == 2:
            # Advance to Grand Finals (Round 3, Match 0)
            finals = db.query(TournamentMatch).filter(
                TournamentMatch.tournament_id == t.id,
                TournamentMatch.round_number == 3,
                TournamentMatch.match_index == 0
            ).first()

            sf1 = db.query(TournamentMatch).filter(TournamentMatch.tournament_id == t.id, TournamentMatch.round_number == 2, TournamentMatch.match_index == 1).first()

            finals.participant1_id = user_part.id
            finals.participant2_id = sf1.winner_id
            finals.status = "ready"
            next_match_id = finals.id
            t.current_round = 3

        elif t.current_round == 3:
            # User won Grand Finals!
            is_champion = True
            is_tournament_over = True
            t.status = "completed"
            t.winner_id = current_user.id
            coins_reward = t.reward_coins
            gems_reward = t.reward_gems
            pack_reward = t.reward_pack_id

            current_user.coins += coins_reward
            current_user.gems += gems_reward

            # Add pack reward if present
            if pack_reward:
                pp = db.query(PlayerPack).filter(
                    PlayerPack.user_id == current_user.id,
                    PlayerPack.pack_id == pack_reward
                ).first()
                if pp:
                    pp.quantity += 1
                else:
                    db.add(PlayerPack(user_id=current_user.id, pack_id=pack_reward, quantity=1))

            db.add(Transaction(
                user_id=current_user.id,
                type="TOURNAMENT_WIN",
                amount=coins_reward,
                currency="coins",
                reference_id=t.id,
                description=f"Championship Prize for winning {t.name}!",
            ))

    current_user.xp += xp_reward
    db.commit()

    return TournamentMatchResultOut(
        match_id=match.id,
        round_number=match.round_number,
        won=user_won,
        is_tournament_over=is_tournament_over,
        is_champion=is_champion,
        coins_awarded=coins_reward,
        gems_awarded=gems_reward,
        xp_awarded=xp_reward,
        pack_awarded=pack_reward,
        battle_log=logs,
        next_match_id=next_match_id,
    )


@router.get("/matches/{match_id}/spectate", response_model=TournamentSpectateMatchOut)
def spectate_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    m = (
        db.query(TournamentMatch)
        .options(
            joinedload(TournamentMatch.p1),
            joinedload(TournamentMatch.p2),
            joinedload(TournamentMatch.winner),
        )
        .filter(TournamentMatch.id == match_id)
        .first()
    )
    if not m:
        raise HTTPException(404, "Match not found")

    try:
        log_items = json.loads(m.battle_log or "[]")
    except:
        log_items = ["No battle record found."]

    out = _format_match_out(m)
    return TournamentSpectateMatchOut(
        **out.model_dump(),
        battle_log=log_items,
    )
