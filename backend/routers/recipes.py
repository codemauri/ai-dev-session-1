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
from auth import get_current_user, get_current_user_optional

# Configure upload directory
UPLOAD_DIR = Path("uploads/recipes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image types and max file size
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


router = APIRouter(
    prefix="/api/recipes",
    tags=["recipes"],
    redirect_slashes=False  # Disable automatic redirect for trailing slashes
)


@router.get("", response_model=List[schemas.Recipe])
@router.get("/", response_model=List[schemas.Recipe])
def list_recipes(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    List recipes with privacy filtering:
    - Not authenticated: Only public recipes
    - Authenticated: Public recipes + your own recipes (public or private)
    """
    query = db.query(models.Recipe)

    # Apply privacy filter based on authentication
    if current_user:
        # Logged in: show public recipes OR recipes owned by current user
        query = query.filter(
            (models.Recipe.is_public == True) | (models.Recipe.user_id == current_user.id)
        )
    else:
        # Not logged in: only show public recipes
        query = query.filter(models.Recipe.is_public == True)

    # Apply category filter if provided
    if category_id is not None:
        query = query.filter(models.Recipe.category_id == category_id)

    recipes = query.offset(skip).limit(limit).all()
    return recipes


@router.get("/search", response_model=List[schemas.Recipe])
@router.get("/search/", response_model=List[schemas.Recipe])
def search_recipes(
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Search recipes using PostgreSQL full-text search (or LIKE for SQLite)
    Searches across title, description, instructions, and ingredients
    Results are ranked by relevance (PostgreSQL only)
    Privacy: Only searches public recipes + your own recipes (if logged in)
    """
    from sqlalchemy import func, desc, or_, and_

    # Check if we're using PostgreSQL or SQLite
    dialect_name = db.bind.dialect.name

    # Build privacy filter
    if current_user:
        privacy_filter = or_(
            models.Recipe.is_public == True,
            models.Recipe.user_id == current_user.id
        )
    else:
        privacy_filter = models.Recipe.is_public == True

    if dialect_name == "postgresql":
        # Use PostgreSQL full-text search
        search_query = func.plainto_tsquery('english', q)
        recipes = db.query(models.Recipe).filter(
            and_(
                models.Recipe.search_vector.op('@@')(search_query),
                privacy_filter
            )
        ).order_by(
            desc(func.ts_rank(models.Recipe.search_vector, search_query))
        ).offset(skip).limit(limit).all()
    else:
        # Fallback to LIKE search for SQLite (used in tests)
        search_pattern = f"%{q}%"
        recipes = db.query(models.Recipe).filter(
            and_(
                or_(
                    models.Recipe.title.ilike(search_pattern),
                    models.Recipe.description.ilike(search_pattern),
                    models.Recipe.instructions.ilike(search_pattern)
                ),
                privacy_filter
            )
        ).offset(skip).limit(limit).all()

    return recipes


@router.post("", response_model=schemas.Recipe, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.Recipe, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe: schemas.RecipeCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new recipe with ingredients (requires authentication)
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
    db_recipe = models.Recipe(**recipe_data, user_id=current_user.id)

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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a recipe and its ingredients (requires authentication and ownership)
    """
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    # Check ownership
    if db_recipe.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this recipe"
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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a recipe (requires authentication and ownership)
    Ingredients will be deleted automatically due to cascade.
    """
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    # Check ownership
    if db_recipe.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this recipe"
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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a share link for a recipe (requires authentication and ownership)
    Creates a unique token that allows anyone with the link to view the recipe
    Note: This is independent of is_public - recipe can be private but still shareable via link
    """
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    # Check ownership
    if db_recipe.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to share this recipe"
        )

    try:
        # Generate a new share token if one doesn't exist
        if not db_recipe.share_token:
            db_recipe.share_token = str(uuid.uuid4())

        # NOTE: We do NOT set is_public here
        # is_public controls list/search visibility
        # share_token controls link-based access
        # These are independent features

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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke share link for a recipe (requires authentication and ownership)
    Clears the share token, making the share link no longer work
    Note: This does NOT affect is_public - recipe visibility in lists/searches is independent
    """
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )

    # Check ownership
    if db_recipe.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to unshare this recipe"
        )

    try:
        # Clear the share token to revoke the share link
        db_recipe.share_token = None

        # NOTE: We do NOT set is_public here
        # is_public controls list/search visibility (independent feature)

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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload an image for a recipe (requires authentication and ownership)
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

    # Check ownership
    if db_recipe.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload images for this recipe"
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
