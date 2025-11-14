from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TSVECTOR
from database import Base
import uuid


class Category(Base):
    """Category model for recipe categorization"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Relationship with recipes
    recipes = relationship("Recipe", back_populates="category")


class Recipe(Base):
    """Recipe model for storing recipe information"""
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=False)
    prep_time = Column(Integer, nullable=True)  # in minutes
    cook_time = Column(Integer, nullable=True)  # in minutes
    servings = Column(Integer, nullable=True)
    calories = Column(Integer, nullable=True)  # total calories per serving
    protein = Column(Float, nullable=True)  # grams of protein per serving
    carbohydrates = Column(Float, nullable=True)  # grams of carbs per serving
    fat = Column(Float, nullable=True)  # grams of fat per serving
    rating = Column(Float, nullable=True)  # 0-5 star rating
    image_url = Column(String(500), nullable=True)  # URL/path to recipe image
    is_public = Column(Boolean, default=False, nullable=False)  # whether recipe is publicly shareable
    share_token = Column(String(36), unique=True, nullable=True, index=True)  # UUID for sharing
    search_vector = Column(Text().with_variant(TSVECTOR, "postgresql"), nullable=True)  # Full-text search vector
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="recipes")
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")


class Ingredient(Base):
    """Ingredient model for recipe ingredients"""
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    name = Column(String(200), nullable=False)
    amount = Column(String(50), nullable=True)  # e.g., "2", "1/2"
    unit = Column(String(50), nullable=True)     # e.g., "cups", "tbsp", "grams"

    # Relationship with recipe
    recipe = relationship("Recipe", back_populates="ingredients")


class MealPlan(Base):
    """Meal plan model for planning meals by date and meal type"""
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    meal_type = Column(String(20), nullable=False, index=True)  # breakfast, lunch, dinner, snack
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship with recipe
    recipe = relationship("Recipe")
