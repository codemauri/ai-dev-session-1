"""
Pytest configuration and fixtures for backend tests
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from main import app
from database import Base, get_db
from models import Recipe, Category, Ingredient, MealPlan
from datetime import date


# Create in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database for each test
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create a new session for the test
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Drop all tables after the test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a test client with test database
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def sample_category(db_session):
    """
    Create a sample category for testing
    """
    category = Category(
        name="Breakfast",
        description="Morning meals"
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture
def sample_recipe(db_session, sample_category):
    """
    Create a sample recipe with ingredients for testing
    """
    recipe = Recipe(
        title="Pancakes",
        description="Fluffy breakfast pancakes",
        instructions="Mix ingredients and cook on griddle",
        prep_time=10,
        cook_time=15,
        servings=4,
        category_id=sample_category.id
    )
    db_session.add(recipe)
    db_session.commit()
    db_session.refresh(recipe)

    # Add ingredients
    ingredients = [
        Ingredient(recipe_id=recipe.id, name="Flour", amount="2", unit="cups"),
        Ingredient(recipe_id=recipe.id, name="Milk", amount="1.5", unit="cups"),
        Ingredient(recipe_id=recipe.id, name="Eggs", amount="2", unit="whole"),
    ]
    for ingredient in ingredients:
        db_session.add(ingredient)
    db_session.commit()

    return recipe


@pytest.fixture
def sample_meal_plan(db_session, sample_recipe):
    """
    Create a sample meal plan for testing
    """
    meal_plan = MealPlan(
        date=date(2024, 1, 15),
        meal_type="breakfast",
        recipe_id=sample_recipe.id,
        notes="Test meal plan"
    )
    db_session.add(meal_plan)
    db_session.commit()
    db_session.refresh(meal_plan)
    return meal_plan
