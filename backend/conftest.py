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
from models import Recipe, Category, Ingredient, MealPlan, User
from datetime import date
from auth import get_password_hash


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
def authenticated_user(client, sample_user):
    """
    Login as sample_user and return token
    This ensures sample_recipe is owned by the authenticated user
    """
    login_data = {
        "email": "testuser@example.com",
        "password": "testpass123"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    return {
        "token": data["access_token"],
        "user_id": sample_user.id,
        "email": sample_user.email
    }


@pytest.fixture
def sample_category(db_session, sample_user):
    """
    Create a sample category for testing
    Category is owned by sample_user (same as authenticated_user)
    """
    category = Category(
        name="Breakfast",
        description="Morning meals",
        user_id=sample_user.id
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture
def sample_user(db_session):
    """
    Create a sample user for testing - used by sample_recipe
    """
    user = User(
        email="testuser@example.com",  # Same email as authenticated_user
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_recipe(db_session, sample_category, sample_user):
    """
    Create a sample recipe with ingredients for testing
    Recipe is owned by sample_user (same as authenticated_user)
    """
    recipe = Recipe(
        title="Pancakes",
        description="Fluffy breakfast pancakes",
        instructions="Mix ingredients and cook on griddle",
        prep_time=10,
        cook_time=15,
        servings=4,
        category_id=sample_category.id,
        user_id=sample_user.id,
        is_public=False  # Start as private (share tests need it private)
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
def sample_meal_plan(db_session, sample_recipe, sample_user):
    """
    Create a sample meal plan for testing
    Meal plan is owned by sample_user (same as authenticated_user)
    """
    meal_plan = MealPlan(
        date=date(2024, 1, 15),
        meal_type="breakfast",
        recipe_id=sample_recipe.id,
        user_id=sample_user.id,
        notes="Test meal plan"
    )
    db_session.add(meal_plan)
    db_session.commit()
    db_session.refresh(meal_plan)
    return meal_plan


@pytest.fixture
def admin_user(db_session):
    """
    Create an admin user for testing admin endpoints
    """
    admin = User(
        email="admin@example.com",
        hashed_password=get_password_hash("adminpass123"),
        full_name="Admin User",
        is_admin=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def authenticated_admin(client, admin_user):
    """
    Login as admin user and return token
    """
    login_data = {
        "email": "admin@example.com",
        "password": "adminpass123"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    return {
        "token": data["access_token"],
        "user_id": admin_user.id,
        "email": admin_user.email
    }


@pytest.fixture
def second_user(db_session):
    """
    Create a second regular user for testing
    """
    user = User(
        email="user2@example.com",
        hashed_password=get_password_hash("user2pass123"),
        full_name="Second User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
