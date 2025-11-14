"""
Integration tests for API endpoints
"""
import pytest


class TestHealthEndpoint:
    """Tests for health check endpoint"""

    def test_health_check(self, client):
        """Test that health endpoint returns OK"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data


class TestCategoryEndpoints:
    """Tests for category API endpoints"""

    def test_create_category(self, client):
        """Test creating a new category"""
        category_data = {
            "name": "Desserts",
            "description": "Sweet treats"
        }
        response = client.post("/api/categories", json=category_data)
        assert response.status_code in [200, 201]  # Accept both 200 and 201
        data = response.json()
        assert data["name"] == "Desserts"
        assert data["description"] == "Sweet treats"
        assert "id" in data

    def test_get_all_categories(self, client, sample_category):
        """Test getting all categories"""
        response = client.get("/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["name"] == sample_category.name

    def test_get_category_by_id(self, client, sample_category):
        """Test getting a specific category"""
        response = client.get(f"/api/categories/{sample_category.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_category.id
        assert data["name"] == sample_category.name

    def test_get_nonexistent_category(self, client):
        """Test getting a category that doesn't exist"""
        response = client.get("/api/categories/9999")
        assert response.status_code == 404

    def test_update_category(self, client, sample_category):
        """Test updating a category"""
        update_data = {
            "name": "Updated Breakfast",
            "description": "Updated description"
        }
        response = client.put(f"/api/categories/{sample_category.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Breakfast"
        assert data["description"] == "Updated description"

    def test_delete_category(self, client, sample_category):
        """Test deleting a category"""
        response = client.delete(f"/api/categories/{sample_category.id}")
        assert response.status_code in [200, 204]  # Accept both 200 and 204

        # Verify it's deleted
        get_response = client.get(f"/api/categories/{sample_category.id}")
        assert get_response.status_code == 404


class TestRecipeEndpoints:
    """Tests for recipe API endpoints"""

    def test_create_recipe_with_ingredients(self, client, sample_category):
        """Test creating a recipe with ingredients"""
        recipe_data = {
            "title": "Chocolate Chip Cookies",
            "description": "Delicious homemade cookies",
            "instructions": "Mix, bake, enjoy",
            "prep_time": 15,
            "cook_time": 12,
            "servings": 24,
            "category_id": sample_category.id,
            "ingredients": [
                {"name": "Flour", "amount": "2", "unit": "cups"},
                {"name": "Sugar", "amount": "1", "unit": "cup"},
                {"name": "Chocolate Chips", "amount": "2", "unit": "cups"}
            ]
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Chocolate Chip Cookies"
        assert len(data["ingredients"]) == 3
        assert data["rating"] is None  # No rating provided
        assert "id" in data

    def test_create_recipe_with_rating(self, client, sample_category):
        """Test creating a recipe with a rating"""
        recipe_data = {
            "title": "Rated Recipe",
            "description": "A highly rated recipe",
            "instructions": "Cook perfectly",
            "prep_time": 10,
            "cook_time": 20,
            "servings": 4,
            "rating": 4.5,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Rated Recipe"
        assert data["rating"] == 4.5

    def test_create_recipe_with_invalid_rating_too_high(self, client, sample_category):
        """Test creating a recipe with rating above 5"""
        recipe_data = {
            "title": "Invalid Rating Recipe",
            "instructions": "Test",
            "rating": 6.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_create_recipe_with_invalid_rating_negative(self, client, sample_category):
        """Test creating a recipe with negative rating"""
        recipe_data = {
            "title": "Negative Rating Recipe",
            "instructions": "Test",
            "rating": -1.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_create_recipe_with_max_rating(self, client, sample_category):
        """Test creating a recipe with maximum rating (5.0)"""
        recipe_data = {
            "title": "Perfect Recipe",
            "instructions": "Perfect execution",
            "rating": 5.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["rating"] == 5.0

    def test_create_recipe_with_min_rating(self, client, sample_category):
        """Test creating a recipe with minimum rating (0.0)"""
        recipe_data = {
            "title": "Zero Rating Recipe",
            "instructions": "Not great",
            "rating": 0.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["rating"] == 0.0

    def test_get_all_recipes(self, client, sample_recipe):
        """Test getting all recipes"""
        response = client.get("/api/recipes")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["title"] == sample_recipe.title

    def test_get_recipe_by_id(self, client, sample_recipe):
        """Test getting a specific recipe"""
        response = client.get(f"/api/recipes/{sample_recipe.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_recipe.id
        assert data["title"] == sample_recipe.title
        assert "ingredients" in data
        assert len(data["ingredients"]) == 3

    def test_get_nonexistent_recipe(self, client):
        """Test getting a recipe that doesn't exist"""
        response = client.get("/api/recipes/9999")
        assert response.status_code == 404

    def test_filter_recipes_by_category(self, client, sample_recipe, sample_category):
        """Test filtering recipes by category"""
        response = client.get(f"/api/recipes?category_id={sample_category.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(recipe["category_id"] == sample_category.id for recipe in data)

    def test_update_recipe(self, client, sample_recipe):
        """Test updating a recipe"""
        update_data = {
            "title": "Updated Pancakes",
            "description": "Even fluffier pancakes",
            "instructions": "Updated instructions",  # Required field
            "prep_time": 12,
            "ingredients": [
                {"name": "Flour", "amount": "3", "unit": "cups"},
                {"name": "Milk", "amount": "2", "unit": "cups"}
            ]
        }
        response = client.put(f"/api/recipes/{sample_recipe.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Pancakes"
        assert data["prep_time"] == 12
        assert len(data["ingredients"]) == 2

    def test_update_recipe_add_rating(self, client, sample_recipe):
        """Test adding a rating to an existing recipe"""
        # Verify recipe has no rating initially
        get_response = client.get(f"/api/recipes/{sample_recipe.id}")
        assert get_response.json()["rating"] is None

        # Add rating
        update_data = {
            "title": sample_recipe.title,
            "instructions": sample_recipe.instructions,  # Required field
            "rating": 4.5,
            "ingredients": []
        }
        response = client.put(f"/api/recipes/{sample_recipe.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 4.5

    def test_update_recipe_change_rating(self, client, sample_category):
        """Test changing a recipe's rating"""
        # Create recipe with rating
        recipe_data = {
            "title": "Rating Test Recipe",
            "instructions": "Test",
            "rating": 3.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        create_response = client.post("/api/recipes", json=recipe_data)
        assert create_response.status_code in [200, 201]
        recipe_id = create_response.json()["id"]

        # Update rating
        update_data = {
            "title": "Rating Test Recipe",
            "instructions": "Test",  # Required field
            "rating": 5.0,
            "ingredients": []
        }
        response = client.put(f"/api/recipes/{recipe_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 5.0

    def test_update_recipe_remove_rating(self, client, sample_category):
        """Test that omitting rating in update preserves existing rating"""
        # Create recipe with rating
        recipe_data = {
            "title": "Remove Rating Test",
            "instructions": "Test",
            "rating": 4.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        create_response = client.post("/api/recipes", json=recipe_data)
        assert create_response.status_code in [200, 201]
        recipe_id = create_response.json()["id"]

        # Update without including rating field (rating should be preserved)
        update_data = {
            "title": "Updated Title",
            "instructions": "Test",  # Required field
            "ingredients": []
        }
        response = client.put(f"/api/recipes/{recipe_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        # Rating should be preserved when not included in update
        assert data["rating"] == 4.0

    def test_update_recipe_invalid_rating(self, client, sample_recipe):
        """Test updating recipe with invalid rating"""
        update_data = {
            "title": sample_recipe.title,
            "instructions": sample_recipe.instructions,  # Required field
            "rating": 10.0,  # Invalid: above 5
            "ingredients": []
        }
        response = client.put(f"/api/recipes/{sample_recipe.id}", json=update_data)
        assert response.status_code == 422  # Validation error

    def test_create_recipe_with_nutrition(self, client, sample_category):
        """Test creating a recipe with nutritional information"""
        recipe_data = {
            "title": "Protein Smoothie",
            "description": "Healthy post-workout drink",
            "instructions": "Blend all ingredients until smooth",
            "servings": 1,
            "calories": 250,
            "protein": 30.5,
            "carbohydrates": 15.2,
            "fat": 8.0,
            "category_id": sample_category.id,
            "ingredients": [
                {"name": "Protein Powder", "amount": "1", "unit": "scoop"}
            ]
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Protein Smoothie"
        assert data["calories"] == 250
        assert data["protein"] == 30.5
        assert data["carbohydrates"] == 15.2
        assert data["fat"] == 8.0

    def test_create_recipe_with_partial_nutrition(self, client, sample_category):
        """Test creating a recipe with only some nutritional fields"""
        recipe_data = {
            "title": "Snack",
            "instructions": "Eat it",
            "calories": 150,
            "protein": 5.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["calories"] == 150
        assert data["protein"] == 5.0
        assert data["carbohydrates"] is None
        assert data["fat"] is None

    def test_create_recipe_with_invalid_nutrition_negative(self, client, sample_category):
        """Test creating a recipe with negative nutritional values"""
        recipe_data = {
            "title": "Invalid Recipe",
            "instructions": "Test",
            "calories": -100,  # Invalid: negative value
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code == 422  # Validation error

    def test_update_recipe_add_nutrition(self, client, sample_recipe):
        """Test adding nutritional information to an existing recipe"""
        update_data = {
            "title": sample_recipe.title,
            "instructions": sample_recipe.instructions,
            "calories": 300,
            "protein": 12.5,
            "carbohydrates": 45.0,
            "fat": 10.0,
            "ingredients": []
        }
        response = client.put(f"/api/recipes/{sample_recipe.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["calories"] == 300
        assert data["protein"] == 12.5
        assert data["carbohydrates"] == 45.0
        assert data["fat"] == 10.0

    def test_update_recipe_change_nutrition(self, client, sample_category):
        """Test changing nutritional information of a recipe"""
        # First create a recipe with nutrition
        recipe_data = {
            "title": "Recipe to Update",
            "instructions": "Cook it",
            "calories": 200,
            "protein": 10.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        create_response = client.post("/api/recipes", json=recipe_data)
        assert create_response.status_code in [200, 201]
        recipe_id = create_response.json()["id"]

        # Now update the nutrition
        update_data = {
            "title": "Recipe to Update",
            "instructions": "Cook it",
            "calories": 250,
            "protein": 15.0,
            "carbohydrates": 20.0,
            "ingredients": []
        }
        response = client.put(f"/api/recipes/{recipe_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["calories"] == 250
        assert data["protein"] == 15.0
        assert data["carbohydrates"] == 20.0

    def test_create_recipe_with_image_url(self, client, sample_category):
        """Test creating a recipe with an image URL"""
        recipe_data = {
            "title": "Photogenic Pasta",
            "instructions": "Make it look good",
            "image_url": "https://example.com/pasta.jpg",
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Photogenic Pasta"
        assert data["image_url"] == "https://example.com/pasta.jpg"

    def test_update_recipe_add_image_url(self, client, sample_recipe):
        """Test adding an image URL to an existing recipe"""
        update_data = {
            "title": sample_recipe.title,
            "instructions": sample_recipe.instructions,
            "image_url": "https://example.com/updated-image.jpg",
            "ingredients": []
        }
        response = client.put(f"/api/recipes/{sample_recipe.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["image_url"] == "https://example.com/updated-image.jpg"

    def test_delete_recipe(self, client, sample_recipe):
        """Test deleting a recipe"""
        response = client.delete(f"/api/recipes/{sample_recipe.id}")
        assert response.status_code in [200, 204]  # Accept both 200 and 204

        # Verify it's deleted
        get_response = client.get(f"/api/recipes/{sample_recipe.id}")
        assert get_response.status_code == 404

    def test_create_recipe_without_ingredients(self, client, sample_category):
        """Test creating a recipe without ingredients"""
        recipe_data = {
            "title": "Simple Toast",
            "instructions": "Toast the bread",  # Required field
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Simple Toast"
        assert data["ingredients"] == []

    def test_create_recipe_invalid_category(self, client):
        """Test creating a recipe with non-existent category"""
        recipe_data = {
            "title": "Test Recipe",
            "instructions": "Test instructions",  # Required field
            "category_id": 9999,
            "ingredients": []
        }
        response = client.post("/api/recipes", json=recipe_data)
        # Should handle gracefully - either 400 or 404
        assert response.status_code in [400, 404]

    # Recipe Sharing Tests
    def test_share_recipe_generates_token(self, client, sample_recipe):
        """Test that sharing a recipe generates a unique share token"""
        # Verify recipe starts as private
        assert sample_recipe.is_public == False
        assert sample_recipe.share_token is None

        # Share the recipe
        response = client.post(f"/api/recipes/{sample_recipe.id}/share")
        assert response.status_code == 200
        data = response.json()

        # Verify recipe is now public with a share token
        assert data["is_public"] == True
        assert data["share_token"] is not None
        assert len(data["share_token"]) == 36  # UUID format

    def test_share_recipe_keeps_same_token(self, client, sample_recipe):
        """Test that sharing an already shared recipe keeps the same token"""
        # Share the recipe first time
        response1 = client.post(f"/api/recipes/{sample_recipe.id}/share")
        assert response1.status_code == 200
        first_token = response1.json()["share_token"]

        # Share again
        response2 = client.post(f"/api/recipes/{sample_recipe.id}/share")
        assert response2.status_code == 200
        second_token = response2.json()["share_token"]

        # Token should remain the same
        assert first_token == second_token

    def test_unshare_recipe(self, client, sample_recipe):
        """Test that unsharing a recipe makes it private"""
        # Share the recipe first
        share_response = client.post(f"/api/recipes/{sample_recipe.id}/share")
        assert share_response.status_code == 200
        share_token = share_response.json()["share_token"]
        assert share_token is not None

        # Unshare the recipe
        unshare_response = client.post(f"/api/recipes/{sample_recipe.id}/unshare")
        assert unshare_response.status_code == 200
        data = unshare_response.json()

        # Verify recipe is private but token is preserved
        assert data["is_public"] == False
        assert data["share_token"] == share_token  # Token preserved for re-sharing

    def test_get_shared_recipe_by_token(self, client, sample_recipe):
        """Test accessing a public recipe via its share token"""
        # Share the recipe
        share_response = client.post(f"/api/recipes/{sample_recipe.id}/share")
        share_token = share_response.json()["share_token"]

        # Access recipe via public share endpoint
        response = client.get(f"/api/share/{share_token}")
        assert response.status_code == 200
        data = response.json()

        # Verify recipe data
        assert data["id"] == sample_recipe.id
        assert data["title"] == sample_recipe.title
        assert data["is_public"] == True
        assert data["share_token"] == share_token

    def test_get_shared_recipe_not_public(self, client, sample_recipe):
        """Test that private recipes cannot be accessed via share endpoint"""
        # Share then unshare to get a token but make recipe private
        client.post(f"/api/recipes/{sample_recipe.id}/share")
        unshare_response = client.post(f"/api/recipes/{sample_recipe.id}/unshare")
        share_token = unshare_response.json()["share_token"]

        # Try to access the now-private recipe
        response = client.get(f"/api/share/{share_token}")
        assert response.status_code == 404

    def test_get_shared_recipe_invalid_token(self, client):
        """Test accessing recipe with non-existent share token"""
        response = client.get("/api/share/invalid-token-12345")
        assert response.status_code == 404

    def test_share_nonexistent_recipe(self, client):
        """Test sharing a recipe that doesn't exist"""
        response = client.post("/api/recipes/99999/share")
        assert response.status_code == 404

    # Grocery List Tests
    def test_generate_grocery_list_single_recipe(self, client, sample_recipe):
        """Test generating grocery list from a single recipe"""
        response = client.post(
            "/api/grocery-list",
            json={"recipe_ids": [sample_recipe.id]}
        )
        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "items" in data
        assert "total_items" in data
        assert "recipe_count" in data
        assert "recipe_titles" in data

        # Verify data
        assert data["recipe_count"] == 1
        assert sample_recipe.title in data["recipe_titles"]
        assert len(data["items"]) > 0

        # Verify item structure
        item = data["items"][0]
        assert "name" in item
        assert "amount" in item
        assert "unit" in item
        assert "recipe_count" in item
        assert "recipes" in item

    def test_generate_grocery_list_multiple_recipes(self, client, sample_recipe, sample_category):
        """Test generating grocery list from multiple recipes"""
        # Create two new recipes with shared ingredients
        recipe_data1 = {
            "title": "Recipe A",
            "instructions": "Test instructions A",
            "category_id": sample_category.id,
            "ingredients": [
                {"name": "Butter", "amount": "1", "unit": "cup"},
                {"name": "Sugar", "amount": "2", "unit": "tbsp"}
            ]
        }
        recipe_data2 = {
            "title": "Recipe B",
            "instructions": "Test instructions B",
            "category_id": sample_category.id,
            "ingredients": [
                {"name": "Butter", "amount": "1/2", "unit": "cup"},  # Same ingredient, same unit
                {"name": "Vanilla", "amount": "1", "unit": "tsp"}
            ]
        }
        r1 = client.post("/api/recipes", json=recipe_data1)
        r2 = client.post("/api/recipes", json=recipe_data2)
        assert r1.status_code in [200, 201]
        assert r2.status_code in [200, 201]

        recipe1_id = r1.json()["id"]
        recipe2_id = r2.json()["id"]

        # Generate grocery list
        response = client.post(
            "/api/grocery-list",
            json={"recipe_ids": [recipe1_id, recipe2_id]}
        )
        assert response.status_code == 200
        data = response.json()

        # Verify multiple recipes
        assert data["recipe_count"] == 2
        assert len(data["recipe_titles"]) == 2

        # Find butter ingredient (should be combined: 1 + 0.5 = 1.5 cups)
        butter_items = [item for item in data["items"] if item["name"].lower() == "butter"]
        assert len(butter_items) == 1
        butter = butter_items[0]
        assert butter["recipe_count"] == 2  # Used in both recipes
        assert len(butter["recipes"]) == 2
        assert butter["amount"] == "1 1/2"  # 1.5 formatted as mixed number

    def test_generate_grocery_list_aggregates_amounts(self, client, sample_category):
        """Test that grocery list correctly aggregates ingredient amounts"""
        # Create recipes with overlapping ingredients
        recipe1_data = {
            "title": "Recipe 1",
            "instructions": "Test",
            "category_id": sample_category.id,
            "ingredients": [
                {"name": "Milk", "amount": "1", "unit": "cup"},
                {"name": "Eggs", "amount": "2", "unit": "whole"}
            ]
        }
        recipe2_data = {
            "title": "Recipe 2",
            "instructions": "Test",
            "category_id": sample_category.id,
            "ingredients": [
                {"name": "Milk", "amount": "2", "unit": "cup"},
                {"name": "Eggs", "amount": "3", "unit": "whole"}
            ]
        }

        r1 = client.post("/api/recipes", json=recipe1_data)
        r2 = client.post("/api/recipes", json=recipe2_data)
        assert r1.status_code in [200, 201]
        assert r2.status_code in [200, 201]

        recipe1_id = r1.json()["id"]
        recipe2_id = r2.json()["id"]

        # Generate grocery list
        response = client.post(
            "/api/grocery-list",
            json={"recipe_ids": [recipe1_id, recipe2_id]}
        )
        assert response.status_code == 200
        data = response.json()

        # Find milk - should be 3 cups total
        milk = next(item for item in data["items"] if item["name"].lower() == "milk")
        assert milk["amount"] == "3"
        assert milk["unit"] == "cup"

        # Find eggs - should be 5 total
        eggs = next(item for item in data["items"] if item["name"].lower() == "eggs")
        assert eggs["amount"] == "5"
        assert eggs["unit"] == "whole"

    def test_generate_grocery_list_different_units(self, client, sample_category):
        """Test that ingredients with different units are kept separate"""
        recipe_data = {
            "title": "Test Recipe",
            "instructions": "Test",
            "category_id": sample_category.id,
            "ingredients": [
                {"name": "Milk", "amount": "1", "unit": "cup"},
                {"name": "Milk", "amount": "2", "unit": "tbsp"}
            ]
        }

        r = client.post("/api/recipes", json=recipe_data)
        assert r.status_code in [200, 201]
        recipe_id = r.json()["id"]

        # Generate grocery list
        response = client.post(
            "/api/grocery-list",
            json={"recipe_ids": [recipe_id]}
        )
        assert response.status_code == 200
        data = response.json()

        # Should have 2 separate milk entries
        milk_items = [item for item in data["items"] if item["name"].lower() == "milk"]
        assert len(milk_items) == 2

        # Check units are different
        units = {item["unit"] for item in milk_items}
        assert "cup" in units
        assert "tbsp" in units

    def test_generate_grocery_list_empty_recipe_ids(self, client):
        """Test that empty recipe_ids list returns error"""
        response = client.post(
            "/api/grocery-list",
            json={"recipe_ids": []}
        )
        assert response.status_code == 422  # Validation error

    def test_generate_grocery_list_nonexistent_recipe(self, client):
        """Test grocery list generation with non-existent recipe ID"""
        response = client.post(
            "/api/grocery-list",
            json={"recipe_ids": [99999]}
        )
        assert response.status_code == 404

    def test_generate_grocery_list_mixed_valid_invalid_ids(self, client, sample_recipe):
        """Test grocery list with mix of valid and invalid recipe IDs"""
        response = client.post(
            "/api/grocery-list",
            json={"recipe_ids": [sample_recipe.id, 99999]}
        )
        assert response.status_code == 404


class TestMealPlanEndpoints:
    """Tests for meal plan API endpoints"""

    def test_create_meal_plan(self, client, sample_recipe):
        """Test creating a new meal plan"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "lunch",
            "recipe_id": sample_recipe.id,
            "notes": "Meal prep for work"
        }
        response = client.post("/api/meal-plans", json=meal_plan_data)
        assert response.status_code == 201
        data = response.json()
        assert data["meal_type"] == "lunch"
        assert data["recipe_id"] == sample_recipe.id
        assert data["notes"] == "Meal prep for work"
        assert "id" in data
        assert "created_at" in data

    def test_create_meal_plan_case_insensitive_meal_type(self, client, sample_recipe):
        """Test that meal type is case-insensitive"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "DINNER",  # Uppercase
            "recipe_id": sample_recipe.id
        }
        response = client.post("/api/meal-plans", json=meal_plan_data)
        assert response.status_code == 201
        data = response.json()
        assert data["meal_type"] == "dinner"  # Should be lowercased

    def test_create_meal_plan_all_meal_types(self, client, sample_recipe):
        """Test creating meal plans for all valid meal types"""
        valid_meal_types = ["breakfast", "lunch", "dinner", "snack"]

        for meal_type in valid_meal_types:
            meal_plan_data = {
                "date": "2024-01-20",
                "meal_type": meal_type,
                "recipe_id": sample_recipe.id
            }
            response = client.post("/api/meal-plans", json=meal_plan_data)
            assert response.status_code == 201
            data = response.json()
            assert data["meal_type"] == meal_type

    def test_create_meal_plan_invalid_meal_type(self, client, sample_recipe):
        """Test creating meal plan with invalid meal type"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "brunch",  # Invalid
            "recipe_id": sample_recipe.id
        }
        response = client.post("/api/meal-plans", json=meal_plan_data)
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "breakfast" in data["detail"].lower()

    def test_create_meal_plan_nonexistent_recipe(self, client):
        """Test creating meal plan with non-existent recipe"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "lunch",
            "recipe_id": 99999
        }
        response = client.post("/api/meal-plans", json=meal_plan_data)
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_create_meal_plan_without_notes(self, client, sample_recipe):
        """Test creating meal plan without optional notes"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "breakfast",
            "recipe_id": sample_recipe.id
        }
        response = client.post("/api/meal-plans", json=meal_plan_data)
        assert response.status_code == 201
        data = response.json()
        assert data["notes"] is None

    def test_get_all_meal_plans(self, client, sample_meal_plan):
        """Test getting all meal plans"""
        response = client.get("/api/meal-plans")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["id"] == sample_meal_plan.id
        assert data[0]["meal_type"] == sample_meal_plan.meal_type

    def test_get_meal_plans_filter_by_date_range(self, client, sample_recipe):
        """Test filtering meal plans by date range"""
        # Create meal plans on different dates
        dates = ["2024-01-10", "2024-01-15", "2024-01-20", "2024-01-25"]
        for date_str in dates:
            meal_plan_data = {
                "date": date_str,
                "meal_type": "lunch",
                "recipe_id": sample_recipe.id
            }
            response = client.post("/api/meal-plans", json=meal_plan_data)
            assert response.status_code == 201

        # Filter for specific date range
        response = client.get("/api/meal-plans?start_date=2024-01-14&end_date=2024-01-21")
        assert response.status_code == 200
        data = response.json()

        # Should only get meal plans from Jan 15 and Jan 20
        assert len(data) == 2
        dates_in_range = [item["date"] for item in data]
        assert "2024-01-15" in dates_in_range
        assert "2024-01-20" in dates_in_range
        assert "2024-01-10" not in dates_in_range
        assert "2024-01-25" not in dates_in_range

    def test_get_meal_plans_filter_by_start_date_only(self, client, sample_recipe):
        """Test filtering meal plans with only start_date"""
        dates = ["2024-01-10", "2024-01-20", "2024-01-30"]
        for date_str in dates:
            meal_plan_data = {
                "date": date_str,
                "meal_type": "dinner",
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data)

        response = client.get("/api/meal-plans?start_date=2024-01-15")
        assert response.status_code == 200
        data = response.json()

        # Should get Jan 20 and Jan 30 only
        dates_returned = [item["date"] for item in data]
        assert "2024-01-10" not in dates_returned
        assert "2024-01-20" in dates_returned
        assert "2024-01-30" in dates_returned

    def test_get_meal_plans_filter_by_end_date_only(self, client, sample_recipe):
        """Test filtering meal plans with only end_date"""
        dates = ["2024-01-10", "2024-01-20", "2024-01-30"]
        for date_str in dates:
            meal_plan_data = {
                "date": date_str,
                "meal_type": "dinner",
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data)

        response = client.get("/api/meal-plans?end_date=2024-01-25")
        assert response.status_code == 200
        data = response.json()

        # Should get Jan 10 and Jan 20 only
        dates_returned = [item["date"] for item in data]
        assert "2024-01-10" in dates_returned
        assert "2024-01-20" in dates_returned
        assert "2024-01-30" not in dates_returned

    def test_get_meal_plans_filter_by_meal_type(self, client, sample_recipe):
        """Test filtering meal plans by meal type"""
        meal_types = ["breakfast", "lunch", "dinner"]
        for meal_type in meal_types:
            meal_plan_data = {
                "date": "2024-01-20",
                "meal_type": meal_type,
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data)

        response = client.get("/api/meal-plans?meal_type=lunch")
        assert response.status_code == 200
        data = response.json()

        # Should only get lunch meal plans
        assert all(item["meal_type"] == "lunch" for item in data)
        assert len(data) >= 1

    def test_get_meal_plans_filter_by_date_and_meal_type(self, client, sample_recipe):
        """Test filtering meal plans by both date range and meal type"""
        # Create various meal plans
        test_data = [
            {"date": "2024-01-15", "meal_type": "breakfast"},
            {"date": "2024-01-15", "meal_type": "dinner"},
            {"date": "2024-01-20", "meal_type": "breakfast"},
            {"date": "2024-01-25", "meal_type": "breakfast"},
        ]
        for item in test_data:
            meal_plan_data = {
                "date": item["date"],
                "meal_type": item["meal_type"],
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data)

        # Filter for breakfast between Jan 15-22
        response = client.get("/api/meal-plans?start_date=2024-01-15&end_date=2024-01-22&meal_type=breakfast")
        assert response.status_code == 200
        data = response.json()

        # Should get only breakfast from Jan 15 and Jan 20
        assert len(data) == 2
        assert all(item["meal_type"] == "breakfast" for item in data)
        dates = [item["date"] for item in data]
        assert "2024-01-15" in dates
        assert "2024-01-20" in dates

    def test_get_week_meal_plans(self, client, sample_recipe):
        """Test getting meal plans for a specific week"""
        # Create meal plans for a 2-week period
        dates = [
            "2024-01-08", "2024-01-10", "2024-01-12",  # Week before
            "2024-01-15", "2024-01-17", "2024-01-19", "2024-01-21",  # Target week
            "2024-01-23", "2024-01-25"  # Week after
        ]
        for date_str in dates:
            meal_plan_data = {
                "date": date_str,
                "meal_type": "dinner",
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data)

        # Get week starting Jan 15 (should include Jan 15-21)
        response = client.get("/api/meal-plans/week?start_date=2024-01-15")
        assert response.status_code == 200
        data = response.json()

        # Should get only meal plans from Jan 15-21
        dates_returned = [item["date"] for item in data]
        assert "2024-01-15" in dates_returned
        assert "2024-01-17" in dates_returned
        assert "2024-01-19" in dates_returned
        assert "2024-01-21" in dates_returned
        assert "2024-01-12" not in dates_returned
        assert "2024-01-23" not in dates_returned

    def test_get_meal_plan_by_id(self, client, sample_meal_plan):
        """Test getting a specific meal plan by ID"""
        response = client.get(f"/api/meal-plans/{sample_meal_plan.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_meal_plan.id
        assert data["meal_type"] == sample_meal_plan.meal_type
        assert data["recipe_id"] == sample_meal_plan.recipe_id
        assert "recipe" in data  # Should include recipe relationship

    def test_get_nonexistent_meal_plan(self, client):
        """Test getting a meal plan that doesn't exist"""
        response = client.get("/api/meal-plans/99999")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_update_meal_plan_change_recipe(self, client, sample_meal_plan, sample_category):
        """Test updating a meal plan to change recipe"""
        # Create a new recipe
        recipe_data = {
            "title": "New Recipe",
            "instructions": "New instructions",
            "category_id": sample_category.id,
            "ingredients": []
        }
        recipe_response = client.post("/api/recipes", json=recipe_data)
        new_recipe_id = recipe_response.json()["id"]

        # Update meal plan with new recipe
        update_data = {
            "recipe_id": new_recipe_id
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["recipe_id"] == new_recipe_id

    def test_update_meal_plan_change_meal_type(self, client, sample_meal_plan):
        """Test updating meal type"""
        update_data = {
            "meal_type": "dinner"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["meal_type"] == "dinner"

    def test_update_meal_plan_change_date(self, client, sample_meal_plan):
        """Test updating meal plan date"""
        update_data = {
            "date": "2024-02-01"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == "2024-02-01"

    def test_update_meal_plan_change_notes(self, client, sample_meal_plan):
        """Test updating meal plan notes"""
        update_data = {
            "notes": "Updated notes for meal"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "Updated notes for meal"

    def test_update_meal_plan_multiple_fields(self, client, sample_meal_plan):
        """Test updating multiple fields at once"""
        update_data = {
            "date": "2024-03-15",
            "meal_type": "snack",
            "notes": "Afternoon snack"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == "2024-03-15"
        assert data["meal_type"] == "snack"
        assert data["notes"] == "Afternoon snack"

    def test_update_meal_plan_invalid_meal_type(self, client, sample_meal_plan):
        """Test updating with invalid meal type"""
        update_data = {
            "meal_type": "invalid_meal"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data)
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    def test_update_meal_plan_nonexistent_recipe(self, client, sample_meal_plan):
        """Test updating with non-existent recipe"""
        update_data = {
            "recipe_id": 99999
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data)
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_update_nonexistent_meal_plan(self, client):
        """Test updating a meal plan that doesn't exist"""
        update_data = {
            "notes": "Updated notes"
        }
        response = client.put("/api/meal-plans/99999", json=update_data)
        assert response.status_code == 404

    def test_delete_meal_plan(self, client, sample_meal_plan):
        """Test deleting a meal plan"""
        response = client.delete(f"/api/meal-plans/{sample_meal_plan.id}")
        assert response.status_code == 204

        # Verify it's deleted
        get_response = client.get(f"/api/meal-plans/{sample_meal_plan.id}")
        assert get_response.status_code == 404

    def test_delete_nonexistent_meal_plan(self, client):
        """Test deleting a meal plan that doesn't exist"""
        response = client.delete("/api/meal-plans/99999")
        assert response.status_code == 404

    def test_meal_plan_ordering(self, client, sample_recipe):
        """Test that meal plans are ordered by date and meal type"""
        # Create meal plans in random order
        meal_plans = [
            {"date": "2024-01-20", "meal_type": "dinner"},
            {"date": "2024-01-15", "meal_type": "lunch"},
            {"date": "2024-01-15", "meal_type": "breakfast"},
            {"date": "2024-01-20", "meal_type": "breakfast"},
        ]
        for mp in meal_plans:
            meal_plan_data = {
                "date": mp["date"],
                "meal_type": mp["meal_type"],
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data)

        # Get all meal plans
        response = client.get("/api/meal-plans")
        assert response.status_code == 200
        data = response.json()

        # Verify ordering (date ascending, then meal type)
        assert len(data) >= 4
        # First should be Jan 15 breakfast
        assert data[0]["date"] == "2024-01-15"
        assert data[0]["meal_type"] == "breakfast"
        # Second should be Jan 15 lunch
        assert data[1]["date"] == "2024-01-15"
        assert data[1]["meal_type"] == "lunch"


class TestImageUpload:
    """Tests for recipe image upload functionality"""

    def test_upload_image_success(self, client, sample_recipe):
        """Test successful image upload"""
        import io
        from PIL import Image

        # Create a test image
        image = Image.new('RGB', (100, 100), color='red')
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='JPEG')
        image_bytes.seek(0)

        # Upload the image
        response = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("test_image.jpg", image_bytes, "image/jpeg")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_recipe.id
        assert data["image_url"] is not None
        assert "/uploads/recipes/" in data["image_url"]
        assert data["image_url"].endswith(".jpg")

    def test_upload_image_recipe_not_found(self, client):
        """Test uploading image for non-existent recipe"""
        import io
        from PIL import Image

        image = Image.new('RGB', (100, 100), color='red')
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='JPEG')
        image_bytes.seek(0)

        response = client.post(
            "/api/recipes/99999/upload-image",
            files={"file": ("test_image.jpg", image_bytes, "image/jpeg")}
        )

        assert response.status_code == 404

    def test_upload_image_invalid_file_type(self, client, sample_recipe):
        """Test uploading non-image file"""
        import io

        # Create a text file
        text_file = io.BytesIO(b"This is not an image")

        response = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("test.txt", text_file, "text/plain")}
        )

        assert response.status_code == 400
        assert "Invalid file type" in response.text

    def test_upload_image_too_large(self, client, sample_recipe):
        """Test uploading image that exceeds size limit"""
        import io
        from PIL import Image

        # Create a large image (> 5MB)
        # Using a very large size to exceed the 5MB limit
        image = Image.new('RGB', (5000, 5000), color='blue')
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='JPEG', quality=100)
        image_bytes.seek(0)

        # Only test if the image is actually > 5MB
        if len(image_bytes.getvalue()) > 5 * 1024 * 1024:
            response = client.post(
                f"/api/recipes/{sample_recipe.id}/upload-image",
                files={"file": ("large_image.jpg", image_bytes, "image/jpeg")}
            )

            assert response.status_code == 400
            assert "File too large" in response.text

    def test_upload_png_image(self, client, sample_recipe):
        """Test uploading PNG image"""
        import io
        from PIL import Image

        image = Image.new('RGBA', (100, 100), color=(0, 255, 0, 255))
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='PNG')
        image_bytes.seek(0)

        response = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("test_image.png", image_bytes, "image/png")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["image_url"].endswith(".png")

    def test_upload_webp_image(self, client, sample_recipe):
        """Test uploading WebP image"""
        import io
        from PIL import Image

        image = Image.new('RGB', (100, 100), color='yellow')
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='WEBP')
        image_bytes.seek(0)

        response = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("test_image.webp", image_bytes, "image/webp")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["image_url"].endswith(".webp")

    def test_upload_image_replaces_previous(self, client, sample_recipe):
        """Test that uploading a new image replaces the previous one"""
        import io
        from PIL import Image

        # Upload first image
        image1 = Image.new('RGB', (100, 100), color='red')
        image_bytes1 = io.BytesIO()
        image1.save(image_bytes1, format='JPEG')
        image_bytes1.seek(0)

        response1 = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("image1.jpg", image_bytes1, "image/jpeg")}
        )
        assert response1.status_code == 200
        first_url = response1.json()["image_url"]

        # Upload second image
        image2 = Image.new('RGB', (100, 100), color='blue')
        image_bytes2 = io.BytesIO()
        image2.save(image_bytes2, format='JPEG')
        image_bytes2.seek(0)

        response2 = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("image2.jpg", image_bytes2, "image/jpeg")}
        )
        assert response2.status_code == 200
        second_url = response2.json()["image_url"]

        # URLs should be different
        assert first_url != second_url

        # Recipe should have the new image URL
        get_response = client.get(f"/api/recipes/{sample_recipe.id}")
        assert get_response.json()["image_url"] == second_url


class TestFullTextSearch:
    """Tests for full-text search functionality"""

    def test_search_by_title(self, client, sample_recipe):
        """Test searching recipes by title"""
        response = client.get("/api/recipes/search?q=Pancakes")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(recipe["title"] == sample_recipe.title for recipe in data)

    def test_search_by_description(self, client, sample_recipe):
        """Test searching recipes by description"""
        # Sample recipe has "Fluffy" in description
        response = client.get("/api/recipes/search?q=Fluffy")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_search_by_instructions(self, client, sample_recipe):
        """Test searching recipes by instructions"""
        # Sample recipe has "griddle" in instructions
        response = client.get("/api/recipes/search?q=griddle")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_search_multiple_words(self, client):
        """Test searching with multiple words"""
        # Create recipe with specific content
        recipe_data = {
            "title": "Italian Pasta Carbonara",
            "description": "Classic Italian pasta dish",
            "instructions": "Cook pasta, mix with eggs and cheese",
            "ingredients": [
                {"name": "spaghetti", "amount": "1", "unit": "lb"},
                {"name": "eggs", "amount": "3", "unit": "whole"}
            ]
        }
        client.post("/api/recipes", json=recipe_data)

        response = client.get("/api/recipes/search?q=italian pasta")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any("Italian" in recipe["title"] for recipe in data)

    def test_search_no_results(self, client):
        """Test search with no matching results"""
        response = client.get("/api/recipes/search?q=nonexistentrecipe12345")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    def test_search_empty_query_fails(self, client):
        """Test that empty search query is rejected"""
        response = client.get("/api/recipes/search?q=")
        assert response.status_code == 422  # Validation error

    def test_search_ranking(self, client):
        """Test that search results are ranked by relevance"""
        # Create recipes with varying relevance
        recipes = [
            {
                "title": "Chocolate Cake",
                "description": "Rich chocolate dessert",
                "instructions": "Bake chocolate cake",
                "ingredients": [{"name": "chocolate", "amount": "2", "unit": "cups"}]
            },
            {
                "title": "Vanilla Cake",
                "description": "Contains some chocolate chips",
                "instructions": "Bake vanilla cake with chocolate chips",
                "ingredients": [{"name": "chocolate chips", "amount": "1", "unit": "cup"}]
            },
            {
                "title": "Pancakes",
                "description": "Breakfast pancakes",
                "instructions": "Make pancakes for breakfast",
                "ingredients": [{"name": "flour", "amount": "2", "unit": "cups"}]
            }
        ]

        for recipe in recipes:
            client.post("/api/recipes", json=recipe)

        # Search for "chocolate" - should rank Chocolate Cake higher
        response = client.get("/api/recipes/search?q=chocolate")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        # First result should be Chocolate Cake (most relevant)
        assert "Chocolate" in data[0]["title"]

    def test_search_partial_word(self, client):
        """Test searching with partial words"""
        recipe_data = {
            "title": "Spaghetti Bolognese",
            "description": "Traditional Italian meat sauce",
            "instructions": "Cook spaghetti and prepare meat sauce",
            "ingredients": [{"name": "spaghetti", "amount": "1", "unit": "lb"}]
        }
        client.post("/api/recipes", json=recipe_data)

        # Search for "spagh" should find "Spaghetti"
        response = client.get("/api/recipes/search?q=bologn")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
