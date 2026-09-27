from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.mission import MissionsSummaryResponse, MissionClaimResponse, PlayerProgressionResponse
from app.api.deps import get_current_user
from app.services.missions_service import sync_user_missions, claim_mission_reward, get_player_progression

router = APIRouter(prefix="/missions", tags=["Missions & Progression"])

@router.get("/me", response_model=MissionsSummaryResponse)
def get_my_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve categorized daily directives, weekly bounties, and achievements for the current player."""
    return sync_user_missions(current_user, db)

@router.post("/{mission_id}/claim", response_model=MissionClaimResponse)
def claim_mission(
    mission_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Claim rewards for a completed mission. Evaluates level-up conditions and credits coins/gems/XP."""
    try:
        return claim_mission_reward(current_user, mission_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/progression/me", response_model=PlayerProgressionResponse)
def get_my_progression(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed progression, rank, and XP metrics for the current player."""
    return get_player_progression(current_user, db)
