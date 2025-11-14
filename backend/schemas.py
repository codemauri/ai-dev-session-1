from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from datetime import date as DateType


# Ingredient Schemas
class IngredientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    amount: Optional[str] = Field(None, max_length=50)
    unit: Optional[str] = Field(None, max_length=50)


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(IngredientBase):
    pass


class Ingredient(IngredientBase):
    id: int
    recipe_id: int

    class Config:
        from_attributes = True


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# Recipe Schemas
class RecipeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    instructions: str = Field(..., min_length=1)
    prep_time: Optional[int] = Field(None, ge=0)  # in minutes
    cook_time: Optional[int] = Field(None, ge=0)  # in minutes
    servings: Optional[int] = Field(None, ge=1)
    calories: Optional[int] = Field(None, ge=0)  # calories per serving
    protein: Optional[float] = Field(None, ge=0)  # grams per serving
    carbohydrates: Optional[float] = Field(None, ge=0)  # grams per serving
    fat: Optional[float] = Field(None, ge=0)  # grams per serving
    rating: Optional[float] = Field(None, ge=0, le=5)  # 0-5 star rating
    image_url: Optional[str] = Field(None, max_length=500)  # URL/path to recipe image
    is_public: Optional[bool] = False  # whether recipe is publicly shareable
    category_id: Optional[int] = None


class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate] = []


class RecipeUpdate(RecipeBase):
    ingredients: Optional[List[IngredientCreate]] = None


class Recipe(RecipeBase):
    id: int
    share_token: Optional[str] = None  # UUID token for sharing
    created_at: datetime
    updated_at: datetime
    category: Optional[Category] = None
    ingredients: List[Ingredient] = []

    class Config:
        from_attributes = True


# Response Models
class RecipeList(BaseModel):
    recipes: List[Recipe]
    total: int


class CategoryList(BaseModel):
    categories: List[Category]
    total: int


# Grocery List Schemas
class GroceryListRequest(BaseModel):
    recipe_ids: List[int] = Field(..., min_items=1, description="List of recipe IDs to generate grocery list from")


class GroceryItem(BaseModel):
    name: str
    amount: str
    unit: str
    recipe_count: int = Field(..., description="Number of recipes using this ingredient")
    recipes: List[str] = Field(..., description="Recipe titles using this ingredient")


class GroceryListResponse(BaseModel):
    items: List[GroceryItem]
    total_items: int
    recipe_count: int
    recipe_titles: List[str]


# Meal Plan Schemas
class MealPlanBase(BaseModel):
    date: DateType = Field(..., description="Date for the meal plan")
    meal_type: str = Field(..., min_length=1, max_length=20, description="Type of meal: breakfast, lunch, dinner, snack")
    recipe_id: int = Field(..., description="Recipe ID for this meal")
    notes: Optional[str] = Field(None, description="Optional notes for this meal")


class MealPlanCreate(MealPlanBase):
    pass


class MealPlanUpdate(BaseModel):
    date: Optional[DateType] = None
    meal_type: Optional[str] = Field(None, min_length=1, max_length=20)
    recipe_id: Optional[int] = None
    notes: Optional[str] = None


class MealPlan(MealPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime
    recipe: Optional['Recipe'] = None

    class Config:
        from_attributes = True
