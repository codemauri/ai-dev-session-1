"""
Admin router for user, recipe, and meal plan management.
Requires admin privileges for all endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models import User, Recipe, MealPlan, Category
import schemas
from auth import get_current_admin_user, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ============================================================================
# STATISTICS
# ============================================================================

@router.get("/stats", response_model=schemas.AdminStats)
def get_stats(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get platform statistics (admin only).

    Returns:
        AdminStats with counts of users, recipes, meal plans, categories
    """
    return schemas.AdminStats(
        total_users=db.query(User).count(),
        active_users=db.query(User).filter(User.is_active == True).count(),
        admin_users=db.query(User).filter(User.is_admin == True).count(),
        total_recipes=db.query(Recipe).count(),
        public_recipes=db.query(Recipe).filter(Recipe.is_public == True).count(),
        total_meal_plans=db.query(MealPlan).count(),
        total_categories=db.query(Category).count()
    )


# ============================================================================
# USER MANAGEMENT
# ============================================================================

@router.get("/users", response_model=List[schemas.User])
def list_users(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all users (admin only).

    Args:
        skip: Number of users to skip (pagination)
        limit: Maximum number of users to return
        admin: Current admin user
        db: Database session

    Returns:
        List of User objects
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=schemas.User)
def get_user(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get user details (admin only).

    Args:
        user_id: User ID
        admin: Current admin user
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return user


@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.AdminUserUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update user details (admin only).

    Args:
        user_id: User ID
        user_update: User update data
        admin: Current admin user
        db: Database session

    Returns:
        Updated User object

    Raises:
        HTTPException: If user not found or email already exists
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Prevent admin from deactivating themselves
    if user_id == admin.id and user_update.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )

    # Prevent admin from removing their own admin status
    if user_id == admin.id and user_update.is_admin is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin privileges"
        )

    # Check if email is being changed and already exists
    if user_update.email and user_update.email != user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_update.email

    # Update other fields
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.is_admin is not None:
        user.is_admin = user_update.is_admin

    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete user (admin only).
    Cascades to delete all user's recipes and meal plans.

    Args:
        user_id: User ID
        admin: Current admin user
        db: Database session

    Raises:
        HTTPException: If user not found or trying to delete yourself
    """
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    db.delete(user)
    db.commit()
    return None


@router.post("/users/{user_id}/reset-password", response_model=dict)
def admin_reset_password(
    user_id: int,
    password_data: schemas.AdminPasswordReset,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Reset user password (admin only).
    Does not require current password.

    Args:
        user_id: User ID
        password_data: New password
        admin: Current admin user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": f"Password reset successfully for user {user.email}"}


# ============================================================================
# RECIPE MANAGEMENT
# ============================================================================

@router.get("/recipes", response_model=List[schemas.Recipe])
def list_all_recipes(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all recipes from all users (admin only).

    Args:
        skip: Number of recipes to skip
        limit: Maximum number of recipes to return
        admin: Current admin user
        db: Database session

    Returns:
        List of Recipe objects
    """
    recipes = db.query(Recipe).offset(skip).limit(limit).all()
    return recipes


@router.delete("/recipes/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_any_recipe(
    recipe_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete any recipe (admin only).
    No ownership check - admin can delete any recipe.

    Args:
        recipe_id: Recipe ID
        admin: Current admin user
        db: Database session

    Raises:
        HTTPException: If recipe not found
    """
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    db.delete(recipe)
    db.commit()
    return None


# ============================================================================
# MEAL PLAN MANAGEMENT
# ============================================================================

@router.get("/meal-plans", response_model=List[schemas.MealPlan])
def list_all_meal_plans(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all meal plans from all users (admin only).

    Args:
        skip: Number of meal plans to skip
        limit: Maximum number of meal plans to return
        admin: Current admin user
        db: Database session

    Returns:
        List of MealPlan objects
    """
    meal_plans = db.query(MealPlan).offset(skip).limit(limit).all()
    return meal_plans


@router.delete("/meal-plans/{meal_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_any_meal_plan(
    meal_plan_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete any meal plan (admin only).
    No ownership check - admin can delete any meal plan.

    Args:
        meal_plan_id: Meal plan ID
        admin: Current admin user
        db: Database session

    Raises:
        HTTPException: If meal plan not found
    """
    meal_plan = db.query(MealPlan).filter(MealPlan.id == meal_plan_id).first()
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal plan with ID {meal_plan_id} not found"
        )

    db.delete(meal_plan)
    db.commit()
    return None
