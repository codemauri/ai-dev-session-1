"""
Authentication router for user registration and login.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Category
import schemas
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Args:
        user_data: User registration data (email, password, full_name)
        db: Database session

    Returns:
        UserResponse containing user info and access token

    Raises:
        HTTPException: If email is already registered
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default categories for new user
    default_categories = ["Breakfast", "Lunch", "Dinner", "Snack"]
    for category_name in default_categories:
        category = Category(
            name=category_name,
            description=f"Default {category_name.lower()} category",
            user_id=new_user.id
        )
        db.add(category)
    db.commit()

    # Create access token
    access_token = create_access_token(data={"sub": new_user.id})

    return schemas.UserResponse(
        user=new_user,
        access_token=access_token,
        token_type="bearer"
    )


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return access token.

    Args:
        credentials: User login credentials (email, password)
        db: Database session

    Returns:
        Token containing access_token and token_type

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    # Verify password
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token = create_access_token(data={"sub": user.id})

    return schemas.Token(
        access_token=access_token,
        token_type="bearer"
    )


@router.get("/me", response_model=schemas.User)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user from JWT token

    Returns:
        User object
    """
    return current_user


@router.post("/change-password", response_model=dict)
def change_password(
    password_data: schemas.PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change password for the current authenticated user.

    Args:
        password_data: Current and new password
        current_user: Current authenticated user from JWT token
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If current password is incorrect
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Hash and update new password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
