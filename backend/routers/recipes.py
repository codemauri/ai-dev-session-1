from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
import shutil
from pathlib import Path

from database import get_db
import models
import schemas

# Configure upload directory
UPLOAD_DIR = Path("uploads/recipes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image types and max file size
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


router = APIRouter(
    prefix="/api/recipes",
    tags=["recipes"]
)


@router.get("/", response_model=List[schemas.Recipe])
def list_recipes(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db)
):
    """
    List all recipes with optional category filter
    """
    query = db.query(models.Recipe)

    # Apply category filter if provided
    if category_id is not None:
        query = query.filter(models.Recipe.category_id == category_id)

    recipes = query.offset(skip).limit(limit).all()
    return recipes


@router.get("/search", response_model=List[schemas.Recipe])
def search_recipes(
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Search recipes using PostgreSQL full-text search (or LIKE for SQLite)
    Searches across title, description, instructions, and ingredients
    Results are ranked by relevance (PostgreSQL only)
    """
    from sqlalchemy import func, desc, or_

    # Check if we're using PostgreSQL or SQLite
    dialect_name = db.bind.dialect.name

    if dialect_name == "postgresql":
        # Use PostgreSQL full-text search
        search_query = func.plainto_tsquery('english', q)
        recipes = db.query(models.Recipe).filter(
            models.Recipe.search_vector.op('@@')(search_query)
        ).order_by(
            desc(func.ts_rank(models.Recipe.search_vector, search_query))
        ).offset(skip).limit(limit).all()
    else:
        # Fallback to LIKE search for SQLite (used in tests)
        search_pattern = f"%{q}%"
        recipes = db.query(models.Recipe).filter(
            or_(
                models.Recipe.title.ilike(search_pattern),
                models.Recipe.description.ilike(search_pattern),
                models.Recipe.instructions.ilike(search_pattern)
            )
        ).offset(skip).limit(limit).all()

    return recipes


@router.post("/", response_model=schemas.Recipe, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe: schemas.RecipeCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new recipe with ingredients
    """
    # Validate category exists if provided
    if recipe.category_id is not None:
        category = db.query(models.Category).filter(
            models.Category.id == recipe.category_id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID {recipe.category_id} not found"
            )

    # Create recipe (without ingredients first)
    recipe_data = recipe.model_dump(exclude={"ingredients"})
    db_recipe = models.Recipe(**recipe_data)

    try:
        db.add(db_recipe)
        db.flush()  # Flush to get recipe ID

        # Create ingredients
        for ingredient_data in recipe.ingredients:
            db_ingredient = models.Ingredient(
                **ingredient_data.model_dump(),
                recipe_id=db_recipe.id
            )
            db.add(db_ingredient)

        db.commit()
        db.refresh(db_recipe)
        return db_recipe
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating recipe: {str(e)}"
        )


@router.get("/{recipe_id}", response_model=schemas.Recipe)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific recipe with ingredients
    """
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    return recipe


@router.put("/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(
    recipe_id: int,
    recipe_update: schemas.RecipeUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a recipe and its ingredients
    """
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    # Validate category exists if provided
    if recipe_update.category_id is not None:
        category = db.query(models.Category).filter(
            models.Category.id == recipe_update.category_id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID {recipe_update.category_id} not found"
            )

    try:
        # Update recipe fields
        recipe_data = recipe_update.model_dump(exclude={"ingredients"})
        for field, value in recipe_data.items():
            if value is not None:
                setattr(db_recipe, field, value)

        # Update ingredients if provided
        if recipe_update.ingredients is not None:
            # Delete existing ingredients
            db.query(models.Ingredient).filter(
                models.Ingredient.recipe_id == recipe_id
            ).delete()

            # Create new ingredients
            for ingredient_data in recipe_update.ingredients:
                db_ingredient = models.Ingredient(
                    **ingredient_data.model_dump(),
                    recipe_id=recipe_id
                )
                db.add(db_ingredient)

        db.commit()
        db.refresh(db_recipe)
        return db_recipe
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating recipe: {str(e)}"
        )


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a recipe (ingredients will be deleted automatically due to cascade)
    """
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    try:
        db.delete(db_recipe)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting recipe: {str(e)}"
        )


@router.post("/{recipe_id}/share", response_model=schemas.Recipe)
def generate_share_token(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate a share token for a recipe and make it public
    """
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    try:
        # Generate a new share token if one doesn't exist
        if not db_recipe.share_token:
            db_recipe.share_token = str(uuid.uuid4())

        # Make recipe public
        db_recipe.is_public = True

        db.commit()
        db.refresh(db_recipe)
        return db_recipe
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating share token: {str(e)}"
        )


@router.post("/{recipe_id}/unshare", response_model=schemas.Recipe)
def remove_share(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    """
    Make a recipe private (unshare it)
    """
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    try:
        # Make recipe private
        db_recipe.is_public = False

        db.commit()
        db.refresh(db_recipe)
        return db_recipe
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing share: {str(e)}"
        )


@router.post("/{recipe_id}/upload-image", response_model=schemas.Recipe)
async def upload_recipe_image(
    recipe_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload an image for a recipe
    Validates file type and size, saves to uploads directory
    Returns updated recipe with image_url set
    """
    # Check if recipe exists
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    # Validate file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content to check size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    try:
        # Generate unique filename using UUID
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)

        # Update recipe with image URL
        # Store as relative path that will be served by static files
        db_recipe.image_url = f"/uploads/recipes/{unique_filename}"

        db.commit()
        db.refresh(db_recipe)
        return db_recipe

    except Exception as e:
        db.rollback()
        # Clean up file if database update fails
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading image: {str(e)}"
        )
