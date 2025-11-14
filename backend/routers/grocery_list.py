from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List
from collections import defaultdict
import re

from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/grocery-list",
    tags=["grocery-list"]
)


def parse_amount(amount_str: str) -> float:
    """
    Parse amount string to float for aggregation.
    Handles fractions (1/2, 1/4), decimals, and whole numbers.
    Returns 0 if parsing fails.
    """
    if not amount_str or not amount_str.strip():
        return 0.0

    amount_str = amount_str.strip()

    # Handle fractions like "1/2", "3/4"
    if '/' in amount_str:
        parts = amount_str.split('/')
        if len(parts) == 2:
            try:
                numerator = float(parts[0].strip())
                denominator = float(parts[1].strip())
                if denominator != 0:
                    return numerator / denominator
            except ValueError:
                pass

    # Handle mixed numbers like "1 1/2"
    if ' ' in amount_str and '/' in amount_str:
        parts = amount_str.split()
        try:
            whole = float(parts[0])
            frac_parts = parts[1].split('/')
            if len(frac_parts) == 2:
                numerator = float(frac_parts[0])
                denominator = float(frac_parts[1])
                if denominator != 0:
                    return whole + (numerator / denominator)
        except (ValueError, IndexError):
            pass

    # Handle simple decimals and whole numbers
    # Extract first number from string (handles "2-3 cups" -> 2)
    match = re.search(r'[\d.]+', amount_str)
    if match:
        try:
            return float(match.group())
        except ValueError:
            pass

    return 0.0


def format_amount(amount: float) -> str:
    """Format amount as a clean string, converting to fractions when appropriate."""
    if amount == 0:
        return "0"

    # Check for common fractions
    fractions = {
        0.125: "1/8",
        0.25: "1/4",
        0.333: "1/3",
        0.375: "3/8",
        0.5: "1/2",
        0.625: "5/8",
        0.666: "2/3",
        0.75: "3/4",
        0.875: "7/8"
    }

    # Check if it's close to a fraction
    for frac_val, frac_str in fractions.items():
        if abs(amount - frac_val) < 0.01:
            return frac_str

    # Check for mixed numbers (e.g., 1.5 -> "1 1/2")
    if amount > 1:
        whole = int(amount)
        decimal = amount - whole
        for frac_val, frac_str in fractions.items():
            if abs(decimal - frac_val) < 0.01:
                return f"{whole} {frac_str}"

    # Format as decimal, removing trailing zeros
    if amount == int(amount):
        return str(int(amount))
    else:
        return f"{amount:.2f}".rstrip('0').rstrip('.')


@router.post("", response_model=schemas.GroceryListResponse)
def generate_grocery_list(
    request: schemas.GroceryListRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a grocery list from multiple recipes.
    Aggregates ingredients by name and unit, combining amounts when possible.
    """
    # Fetch all requested recipes
    recipes = db.query(models.Recipe).filter(
        models.Recipe.id.in_(request.recipe_ids)
    ).all()

    if not recipes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recipes found with the provided IDs"
        )

    if len(recipes) != len(request.recipe_ids):
        found_ids = {r.id for r in recipes}
        missing_ids = set(request.recipe_ids) - found_ids
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipes not found: {missing_ids}"
        )

    # Aggregate ingredients by (name, unit) tuple
    # Structure: {(name, unit): {"amount": float, "recipes": [recipe_titles]}}
    ingredient_map: Dict[tuple, Dict] = defaultdict(lambda: {"amount": 0.0, "recipes": []})

    for recipe in recipes:
        for ingredient in recipe.ingredients:
            name = ingredient.name.strip().lower()
            unit = (ingredient.unit or "").strip().lower()
            amount = parse_amount(ingredient.amount or "0")

            key = (name, unit)
            ingredient_map[key]["amount"] += amount
            if recipe.title not in ingredient_map[key]["recipes"]:
                ingredient_map[key]["recipes"].append(recipe.title)

    # Convert to response format
    grocery_items = []
    for (name, unit), data in sorted(ingredient_map.items()):
        # Capitalize ingredient name properly
        display_name = name.title()

        grocery_items.append(schemas.GroceryItem(
            name=display_name,
            amount=format_amount(data["amount"]),
            unit=unit,
            recipe_count=len(data["recipes"]),
            recipes=data["recipes"]
        ))

    recipe_titles = [r.title for r in recipes]

    return schemas.GroceryListResponse(
        items=grocery_items,
        total_items=len(grocery_items),
        recipe_count=len(recipes),
        recipe_titles=recipe_titles
    )
