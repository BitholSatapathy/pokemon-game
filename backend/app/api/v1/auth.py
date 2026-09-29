from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new player account with starter coins and level."""
    # Check if username or email already registered
    existing_user = db.query(User).filter(
        or_(User.username.ilike(user_in.username), User.email.ilike(user_in.email))
    ).first()
    
    if existing_user:
        if existing_user.username.lower() == user_in.username.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken. Please choose another.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered. Please sign in instead.",
            )

    # Create new player account with Phase 2 starter perks (10,000 Coins, Level 1)
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        coins=10000,
        gems=250,
        level=1,
        xp=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    access_token = create_access_token(subject=new_user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )

@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate player with username/email and password."""
    # Find user by username or email
    user = db.query(User).filter(
        or_(
            User.username.ilike(user_in.username_or_email),
            User.email.ilike(user_in.username_or_email)
        )
    ).first()

    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if getattr(user, "is_banned", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account has been suspended. Reason: {getattr(user, 'ban_reason', None) or 'Violation of community guidelines'}",
        )

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )

@router.get("/me", response_model=UserResponse)
def get_current_player(current_user: User = Depends(get_current_user)):
    """Retrieve profile and balances for the currently authenticated player."""
    return UserResponse.model_validate(current_user)

@router.post("/logout")
def logout():
    """Client-side token acknowledgment."""
    return {"message": "Logged out successfully"}
