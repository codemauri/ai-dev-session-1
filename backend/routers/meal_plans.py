from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/meal-plans",
    tags=["meal-plans"]
)


@router.post("", response_model=schemas.MealPlan, status_code=status.HTTP_201_CREATED)
def create_meal_plan(
    meal_plan: schemas.MealPlanCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new meal plan for a specific date and meal type.
    """
    # Validate recipe exists
    recipe = db.query(models.Recipe).filter(models.Recipe.id == meal_plan.recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with id {meal_plan.recipe_id} not found"
        )

    # Validate meal type
    valid_meal_types = ["breakfast", "lunch", "dinner", "snack"]
    if meal_plan.meal_type.lower() not in valid_meal_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid meal_type. Must be one of: {', '.join(valid_meal_types)}"
        )

    # Create meal plan
    db_meal_plan = models.MealPlan(
        date=meal_plan.date,
        meal_type=meal_plan.meal_type.lower(),
        recipe_id=meal_plan.recipe_id,
        notes=meal_plan.notes
    )
    db.add(db_meal_plan)
    db.commit()
    db.refresh(db_meal_plan)
    return db_meal_plan


@router.get("", response_model=List[schemas.MealPlan])
def get_meal_plans(
    start_date: Optional[date] = Query(None, description="Start date for filtering meal plans"),
    end_date: Optional[date] = Query(None, description="End date for filtering meal plans"),
    meal_type: Optional[str] = Query(None, description="Filter by meal type"),
    db: Session = Depends(get_db)
):
    """
    Get meal plans with optional filtering by date range and meal type.
    If no dates provided, returns all meal plans.
    """
    query = db.query(models.MealPlan)

    # Apply filters
    if start_date:
        query = query.filter(models.MealPlan.date >= start_date)
    if end_date:
        query = query.filter(models.MealPlan.date <= end_date)
    if meal_type:
        query = query.filter(models.MealPlan.meal_type == meal_type.lower())

    # Order by date and meal type
    meal_plans = query.order_by(models.MealPlan.date, models.MealPlan.meal_type).all()
    return meal_plans


@router.get("/week", response_model=List[schemas.MealPlan])
def get_week_meal_plans(
    start_date: date = Query(..., description="Start date of the week"),
    db: Session = Depends(get_db)
):
    """
    Get all meal plans for a specific week (7 days starting from start_date).
    """
    end_date = start_date + timedelta(days=6)
    meal_plans = db.query(models.MealPlan).filter(
        models.MealPlan.date >= start_date,
        models.MealPlan.date <= end_date
    ).order_by(models.MealPlan.date, models.MealPlan.meal_type).all()
    return meal_plans


@router.get("/{meal_plan_id}", response_model=schemas.MealPlan)
def get_meal_plan(
    meal_plan_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific meal plan by ID.
    """
    meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == meal_plan_id).first()
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal plan with id {meal_plan_id} not found"
        )
    return meal_plan


@router.put("/{meal_plan_id}", response_model=schemas.MealPlan)
def update_meal_plan(
    meal_plan_id: int,
    meal_plan_update: schemas.MealPlanUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing meal plan.
    """
    db_meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == meal_plan_id).first()
    if not db_meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal plan with id {meal_plan_id} not found"
        )

    # Validate recipe if being updated
    if meal_plan_update.recipe_id is not None:
        recipe = db.query(models.Recipe).filter(models.Recipe.id == meal_plan_update.recipe_id).first()
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recipe with id {meal_plan_update.recipe_id} not found"
            )
        db_meal_plan.recipe_id = meal_plan_update.recipe_id

    # Validate meal type if being updated
    if meal_plan_update.meal_type is not None:
        valid_meal_types = ["breakfast", "lunch", "dinner", "snack"]
        if meal_plan_update.meal_type.lower() not in valid_meal_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid meal_type. Must be one of: {', '.join(valid_meal_types)}"
            )
        db_meal_plan.meal_type = meal_plan_update.meal_type.lower()

    # Update other fields
    if meal_plan_update.date is not None:
        db_meal_plan.date = meal_plan_update.date
    if meal_plan_update.notes is not None:
        db_meal_plan.notes = meal_plan_update.notes

    db.commit()
    db.refresh(db_meal_plan)
    return db_meal_plan


@router.delete("/{meal_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_plan(
    meal_plan_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a meal plan.
    """
    db_meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == meal_plan_id).first()
    if not db_meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal plan with id {meal_plan_id} not found"
        )

    db.delete(db_meal_plan)
    db.commit()
    return None
