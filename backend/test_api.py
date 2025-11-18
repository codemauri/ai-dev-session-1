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

    def test_create_category(self, client, authenticated_user):
        """Test creating a new category"""
        category_data = {
            "name": "Desserts",
            "description": "Sweet treats"
        }
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = client.post("/api/categories", json=category_data, headers=headers)
        assert response.status_code in [200, 201]  # Accept both 200 and 201
        data = response.json()
        assert data["name"] == "Desserts"
        assert data["description"] == "Sweet treats"
        assert "id" in data
        assert data["user_id"] == authenticated_user["user_id"]

    def test_get_all_categories(self, client, sample_category, authenticated_user):
        """Test getting all categories for authenticated user"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = client.get("/api/categories", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["name"] == sample_category.name
        assert data[0]["user_id"] == authenticated_user["user_id"]

    def test_get_category_by_id(self, client, sample_category, authenticated_user):
        """Test getting a specific category owned by authenticated user"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = client.get(f"/api/categories/{sample_category.id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_category.id
        assert data["name"] == sample_category.name
        assert data["user_id"] == authenticated_user["user_id"]

    def test_get_nonexistent_category(self, client, authenticated_user):
        """Test getting a category that doesn't exist"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = client.get("/api/categories/9999", headers=headers)
        assert response.status_code == 404

    def test_update_category(self, client, sample_category, authenticated_user):
        """Test updating a category owned by authenticated user"""
        update_data = {
            "name": "Updated Breakfast",
            "description": "Updated description"
        }
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = client.put(f"/api/categories/{sample_category.id}", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Breakfast"
        assert data["description"] == "Updated description"
        assert data["user_id"] == authenticated_user["user_id"]

    def test_delete_category(self, client, sample_category, authenticated_user):
        """Test deleting a category owned by authenticated user"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = client.delete(f"/api/categories/{sample_category.id}", headers=headers)
        assert response.status_code in [200, 204]  # Accept both 200 and 204

        # Verify it's deleted
        get_response = client.get(f"/api/categories/{sample_category.id}", headers=headers)
        assert get_response.status_code == 404


class TestRecipeEndpoints:
    """Tests for recipe API endpoints"""

    def test_create_recipe_with_ingredients(self, client, sample_category, authenticated_user):
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
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Chocolate Chip Cookies"
        assert len(data["ingredients"]) == 3
        assert data["rating"] is None  # No rating provided
        assert "id" in data

    def test_create_recipe_with_rating(self, client, sample_category, authenticated_user):
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
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Rated Recipe"
        assert data["rating"] == 4.5

    def test_create_recipe_with_invalid_rating_too_high(self, client, sample_category, authenticated_user):
        """Test creating a recipe with rating above 5"""
        recipe_data = {
            "title": "Invalid Rating Recipe",
            "instructions": "Test",
            "rating": 6.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_create_recipe_with_invalid_rating_negative(self, client, sample_category, authenticated_user):
        """Test creating a recipe with negative rating"""
        recipe_data = {
            "title": "Negative Rating Recipe",
            "instructions": "Test",
            "rating": -1.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_create_recipe_with_max_rating(self, client, sample_category, authenticated_user):
        """Test creating a recipe with maximum rating (5.0)"""
        recipe_data = {
            "title": "Perfect Recipe",
            "instructions": "Perfect execution",
            "rating": 5.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["rating"] == 5.0

    def test_create_recipe_with_min_rating(self, client, sample_category, authenticated_user):
        """Test creating a recipe with minimum rating (0.0)"""
        recipe_data = {
            "title": "Zero Rating Recipe",
            "instructions": "Not great",
            "rating": 0.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["rating"] == 0.0

    def test_get_all_recipes(self, client, sample_recipe, authenticated_user):
        """Test getting all recipes"""
        response = client.get("/api/recipes", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
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

    def test_filter_recipes_by_category(self, client, sample_recipe, sample_category, authenticated_user):
        """Test filtering recipes by category"""
        response = client.get(f"/api/recipes?category_id={sample_category.id}", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(recipe["category_id"] == sample_category.id for recipe in data)

    def test_update_recipe(self, client, sample_recipe, authenticated_user):
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
        response = client.put(
            f"/api/recipes/{sample_recipe.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Pancakes"
        assert data["prep_time"] == 12
        assert len(data["ingredients"]) == 2

    def test_update_recipe_add_rating(self, client, sample_recipe, authenticated_user):
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
        response = client.put(
            f"/api/recipes/{sample_recipe.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 4.5

    def test_update_recipe_change_rating(self, client, sample_category, authenticated_user):
        """Test changing a recipe's rating"""
        # Create recipe with rating
        recipe_data = {
            "title": "Rating Test Recipe",
            "instructions": "Test",
            "rating": 3.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        create_response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert create_response.status_code in [200, 201]
        recipe_id = create_response.json()["id"]

        # Update rating
        update_data = {
            "title": "Rating Test Recipe",
            "instructions": "Test",  # Required field
            "rating": 5.0,
            "ingredients": []
        }
        response = client.put(
            f"/api/recipes/{recipe_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 5.0

    def test_update_recipe_remove_rating(self, client, sample_category, authenticated_user):
        """Test that omitting rating in update preserves existing rating"""
        # Create recipe with rating
        recipe_data = {
            "title": "Remove Rating Test",
            "instructions": "Test",
            "rating": 4.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        create_response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert create_response.status_code in [200, 201]
        recipe_id = create_response.json()["id"]

        # Update without including rating field (rating should be preserved)
        update_data = {
            "title": "Updated Title",
            "instructions": "Test",  # Required field
            "ingredients": []
        }
        response = client.put(
            f"/api/recipes/{recipe_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Rating should be preserved when not included in update
        assert data["rating"] == 4.0

    def test_update_recipe_invalid_rating(self, client, sample_recipe, authenticated_user):
        """Test updating recipe with invalid rating"""
        update_data = {
            "title": sample_recipe.title,
            "instructions": sample_recipe.instructions,  # Required field
            "rating": 10.0,  # Invalid: above 5
            "ingredients": []
        }
        response = client.put(
            f"/api/recipes/{sample_recipe.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 422  # Validation error

    def test_create_recipe_with_nutrition(self, client, sample_category, authenticated_user):
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
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Protein Smoothie"
        assert data["calories"] == 250
        assert data["protein"] == 30.5
        assert data["carbohydrates"] == 15.2
        assert data["fat"] == 8.0

    def test_create_recipe_with_partial_nutrition(self, client, sample_category, authenticated_user):
        """Test creating a recipe with only some nutritional fields"""
        recipe_data = {
            "title": "Snack",
            "instructions": "Eat it",
            "calories": 150,
            "protein": 5.0,
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["calories"] == 150
        assert data["protein"] == 5.0
        assert data["carbohydrates"] is None
        assert data["fat"] is None

    def test_create_recipe_with_invalid_nutrition_negative(self, client, sample_category, authenticated_user):
        """Test creating a recipe with negative nutritional values"""
        recipe_data = {
            "title": "Invalid Recipe",
            "instructions": "Test",
            "calories": -100,  # Invalid: negative value
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 422  # Validation error

    def test_update_recipe_add_nutrition(self, client, sample_recipe, authenticated_user):
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
        response = client.put(
            f"/api/recipes/{sample_recipe.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["calories"] == 300
        assert data["protein"] == 12.5
        assert data["carbohydrates"] == 45.0
        assert data["fat"] == 10.0

    def test_update_recipe_change_nutrition(self, client, sample_category, authenticated_user):
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
        create_response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
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
        response = client.put(
            f"/api/recipes/{recipe_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["calories"] == 250
        assert data["protein"] == 15.0
        assert data["carbohydrates"] == 20.0

    def test_create_recipe_with_image_url(self, client, sample_category, authenticated_user):
        """Test creating a recipe with an image URL"""
        recipe_data = {
            "title": "Photogenic Pasta",
            "instructions": "Make it look good",
            "image_url": "https://example.com/pasta.jpg",
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Photogenic Pasta"
        assert data["image_url"] == "https://example.com/pasta.jpg"

    def test_update_recipe_add_image_url(self, client, sample_recipe, authenticated_user):
        """Test adding an image URL to an existing recipe"""
        update_data = {
            "title": sample_recipe.title,
            "instructions": sample_recipe.instructions,
            "image_url": "https://example.com/updated-image.jpg",
            "ingredients": []
        }
        response = client.put(
            f"/api/recipes/{sample_recipe.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["image_url"] == "https://example.com/updated-image.jpg"

    def test_delete_recipe(self, client, sample_recipe, authenticated_user):
        """Test deleting a recipe"""
        response = client.delete(
            f"/api/recipes/{sample_recipe.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 204]  # Accept both 200 and 204

        # Verify it's deleted
        get_response = client.get(f"/api/recipes/{sample_recipe.id}")
        assert get_response.status_code == 404

    def test_create_recipe_without_ingredients(self, client, sample_category, authenticated_user):
        """Test creating a recipe without ingredients"""
        recipe_data = {
            "title": "Simple Toast",
            "instructions": "Toast the bread",  # Required field
            "category_id": sample_category.id,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Simple Toast"
        assert data["ingredients"] == []

    def test_create_recipe_invalid_category(self, client, authenticated_user):
        """Test creating a recipe with non-existent category"""
        recipe_data = {
            "title": "Test Recipe",
            "instructions": "Test instructions",  # Required field
            "category_id": 9999,
            "ingredients": []
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        # Should handle gracefully - either 400 or 404
        assert response.status_code in [400, 404]

    # Recipe Sharing Tests
    def test_share_recipe_generates_token(self, client, sample_recipe, authenticated_user):
        """Test that sharing a recipe generates a unique share token"""
        # Verify recipe starts as private
        assert sample_recipe.is_public == False
        assert sample_recipe.share_token is None

        # Share the recipe (generates share link)
        response = client.post(
            f"/api/recipes/{sample_recipe.id}/share",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()

        # Verify share token was generated (is_public remains unchanged)
        assert data["share_token"] is not None
        assert len(data["share_token"]) == 36  # UUID format
        assert data["is_public"] == False  # Unchanged - sharing doesn't make it public

    def test_share_recipe_keeps_same_token(self, client, sample_recipe, authenticated_user):
        """Test that sharing an already shared recipe keeps the same token"""
        # Share the recipe first time
        response1 = client.post(
            f"/api/recipes/{sample_recipe.id}/share",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response1.status_code == 200
        first_token = response1.json()["share_token"]

        # Share again
        response2 = client.post(
            f"/api/recipes/{sample_recipe.id}/share",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response2.status_code == 200
        second_token = response2.json()["share_token"]

        # Token should remain the same
        assert first_token == second_token

    def test_unshare_recipe(self, client, sample_recipe, authenticated_user):
        """Test that unsharing a recipe makes it private"""
        # Share the recipe first
        share_response = client.post(
            f"/api/recipes/{sample_recipe.id}/share",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert share_response.status_code == 200
        share_token = share_response.json()["share_token"]
        assert share_token is not None

        # Unshare the recipe (revokes the share link)
        unshare_response = client.post(
            f"/api/recipes/{sample_recipe.id}/unshare",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert unshare_response.status_code == 200
        data = unshare_response.json()

        # Verify token is cleared (share link revoked)
        assert data["share_token"] is None

    def test_get_shared_recipe_by_token(self, client, sample_recipe, authenticated_user):
        """Test accessing a recipe via its share token (even if private)"""
        # Share the recipe (generates share link)
        share_response = client.post(
            f"/api/recipes/{sample_recipe.id}/share",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        share_token = share_response.json()["share_token"]

        # Access recipe via share link (works even though recipe is private)
        response = client.get(f"/api/share/{share_token}")
        assert response.status_code == 200
        data = response.json()

        # Verify recipe data
        assert data["id"] == sample_recipe.id
        assert data["title"] == sample_recipe.title
        assert data["share_token"] == share_token
        # Note: is_public is independent - recipe can be private with share link

    def test_get_shared_recipe_after_unshare(self, client, sample_recipe, authenticated_user):
        """Test that unsharing (revoking share link) makes it inaccessible"""
        # Share the recipe
        share_response = client.post(
            f"/api/recipes/{sample_recipe.id}/share",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        old_token = share_response.json()["share_token"]

        # Verify share link works
        response = client.get(f"/api/share/{old_token}")
        assert response.status_code == 200

        # Unshare the recipe (revokes the share link)
        client.post(
            f"/api/recipes/{sample_recipe.id}/unshare",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        # Try to access with the old token - should fail
        response = client.get(f"/api/share/{old_token}")
        assert response.status_code == 404

    def test_get_shared_recipe_invalid_token(self, client):
        """Test accessing recipe with non-existent share token"""
        response = client.get("/api/share/invalid-token-12345")
        assert response.status_code == 404

    def test_share_nonexistent_recipe(self, client, authenticated_user):
        """Test sharing a recipe that doesn't exist"""
        response = client.post("/api/recipes/99999/share", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
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

    def test_generate_grocery_list_multiple_recipes(self, client, sample_recipe, sample_category, authenticated_user):
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
        r1 = client.post(
            "/api/recipes",
            json=recipe_data1,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        r2 = client.post(
            "/api/recipes",
            json=recipe_data2,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
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

    def test_generate_grocery_list_aggregates_amounts(self, client, sample_category, authenticated_user):
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

        r1 = client.post(
            "/api/recipes",
            json=recipe1_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        r2 = client.post(
            "/api/recipes",
            json=recipe2_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
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

    def test_generate_grocery_list_different_units(self, client, sample_category, authenticated_user):
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

        r = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
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

    def test_create_meal_plan(self, client, sample_recipe, authenticated_user):
        """Test creating a new meal plan"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "lunch",
            "recipe_id": sample_recipe.id,
            "notes": "Meal prep for work"
        }
        response = client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 201
        data = response.json()
        assert data["meal_type"] == "lunch"
        assert data["recipe_id"] == sample_recipe.id
        assert data["notes"] == "Meal prep for work"
        assert "id" in data
        assert "created_at" in data

    def test_create_meal_plan_case_insensitive_meal_type(self, client, sample_recipe, authenticated_user):
        """Test that meal type is case-insensitive"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "DINNER",  # Uppercase
            "recipe_id": sample_recipe.id
        }
        response = client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 201
        data = response.json()
        assert data["meal_type"] == "dinner"  # Should be lowercased

    def test_create_meal_plan_all_meal_types(self, client, sample_recipe, authenticated_user):
        """Test creating meal plans for all valid meal types"""
        valid_meal_types = ["breakfast", "lunch", "dinner", "snack"]

        for meal_type in valid_meal_types:
            meal_plan_data = {
                "date": "2024-01-20",
                "meal_type": meal_type,
                "recipe_id": sample_recipe.id
            }
            response = client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
            assert response.status_code == 201
            data = response.json()
            assert data["meal_type"] == meal_type

    def test_create_meal_plan_invalid_meal_type(self, client, sample_recipe, authenticated_user):
        """Test creating meal plan with invalid meal type"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "brunch",  # Invalid
            "recipe_id": sample_recipe.id
        }
        response = client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "breakfast" in data["detail"].lower()

    def test_create_meal_plan_nonexistent_recipe(self, client, authenticated_user):
        """Test creating meal plan with non-existent recipe"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "lunch",
            "recipe_id": 99999
        }
        response = client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_create_meal_plan_without_notes(self, client, sample_recipe, authenticated_user):
        """Test creating meal plan without optional notes"""
        meal_plan_data = {
            "date": "2024-01-20",
            "meal_type": "breakfast",
            "recipe_id": sample_recipe.id
        }
        response = client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 201
        data = response.json()
        assert data["notes"] is None

    def test_get_all_meal_plans(self, client, sample_meal_plan, authenticated_user):
        """Test getting all meal plans"""
        response = client.get("/api/meal-plans", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["id"] == sample_meal_plan.id
        assert data[0]["meal_type"] == sample_meal_plan.meal_type

    def test_get_meal_plans_filter_by_date_range(self, client, sample_recipe, authenticated_user):
        """Test filtering meal plans by date range"""
        # Create meal plans on different dates
        dates = ["2024-01-10", "2024-01-15", "2024-01-20", "2024-01-25"]
        for date_str in dates:
            meal_plan_data = {
                "date": date_str,
                "meal_type": "lunch",
                "recipe_id": sample_recipe.id
            }
            response = client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
            assert response.status_code == 201

        # Filter for specific date range
        response = client.get("/api/meal-plans?start_date=2024-01-14&end_date=2024-01-21", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()

        # Should only get meal plans from Jan 15 and Jan 20
        assert len(data) == 2
        dates_in_range = [item["date"] for item in data]
        assert "2024-01-15" in dates_in_range
        assert "2024-01-20" in dates_in_range
        assert "2024-01-10" not in dates_in_range
        assert "2024-01-25" not in dates_in_range

    def test_get_meal_plans_filter_by_start_date_only(self, client, sample_recipe, authenticated_user):
        """Test filtering meal plans with only start_date"""
        dates = ["2024-01-10", "2024-01-20", "2024-01-30"]
        for date_str in dates:
            meal_plan_data = {
                "date": date_str,
                "meal_type": "dinner",
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})

        response = client.get("/api/meal-plans?start_date=2024-01-15", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()

        # Should get Jan 20 and Jan 30 only
        dates_returned = [item["date"] for item in data]
        assert "2024-01-10" not in dates_returned
        assert "2024-01-20" in dates_returned
        assert "2024-01-30" in dates_returned

    def test_get_meal_plans_filter_by_end_date_only(self, client, sample_recipe, authenticated_user):
        """Test filtering meal plans with only end_date"""
        dates = ["2024-01-10", "2024-01-20", "2024-01-30"]
        for date_str in dates:
            meal_plan_data = {
                "date": date_str,
                "meal_type": "dinner",
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})

        response = client.get("/api/meal-plans?end_date=2024-01-25", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()

        # Should get Jan 10 and Jan 20 only
        dates_returned = [item["date"] for item in data]
        assert "2024-01-10" in dates_returned
        assert "2024-01-20" in dates_returned
        assert "2024-01-30" not in dates_returned

    def test_get_meal_plans_filter_by_meal_type(self, client, sample_recipe, authenticated_user):
        """Test filtering meal plans by meal type"""
        meal_types = ["breakfast", "lunch", "dinner"]
        for meal_type in meal_types:
            meal_plan_data = {
                "date": "2024-01-20",
                "meal_type": meal_type,
                "recipe_id": sample_recipe.id
            }
            client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})

        response = client.get("/api/meal-plans?meal_type=lunch", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()

        # Should only get lunch meal plans
        assert all(item["meal_type"] == "lunch" for item in data)
        assert len(data) >= 1

    def test_get_meal_plans_filter_by_date_and_meal_type(self, client, sample_recipe, authenticated_user):
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
            client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})

        # Filter for breakfast between Jan 15-22
        response = client.get("/api/meal-plans?start_date=2024-01-15&end_date=2024-01-22&meal_type=breakfast", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()

        # Should get only breakfast from Jan 15 and Jan 20
        assert len(data) == 2
        assert all(item["meal_type"] == "breakfast" for item in data)
        dates = [item["date"] for item in data]
        assert "2024-01-15" in dates
        assert "2024-01-20" in dates

    def test_get_week_meal_plans(self, client, sample_recipe, authenticated_user):
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
            client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})

        # Get week starting Jan 15 (should include Jan 15-21)
        response = client.get("/api/meal-plans/week?start_date=2024-01-15", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
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

    def test_get_meal_plan_by_id(self, client, sample_meal_plan, authenticated_user):
        """Test getting a specific meal plan by ID"""
        response = client.get(f"/api/meal-plans/{sample_meal_plan.id}", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_meal_plan.id
        assert data["meal_type"] == sample_meal_plan.meal_type
        assert data["recipe_id"] == sample_meal_plan.recipe_id
        assert "recipe" in data  # Should include recipe relationship

    def test_get_nonexistent_meal_plan(self, client, authenticated_user):
        """Test getting a meal plan that doesn't exist"""
        response = client.get("/api/meal-plans/99999", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_update_meal_plan_change_recipe(self, client, sample_meal_plan, sample_category, authenticated_user):
        """Test updating a meal plan to change recipe"""
        # Create a new recipe
        recipe_data = {
            "title": "New Recipe",
            "instructions": "New instructions",
            "category_id": sample_category.id,
            "ingredients": []
        }
        recipe_response = client.post("/api/recipes", json=recipe_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        new_recipe_id = recipe_response.json()["id"]

        # Update meal plan with new recipe
        update_data = {
            "recipe_id": new_recipe_id
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert data["recipe_id"] == new_recipe_id

    def test_update_meal_plan_change_meal_type(self, client, sample_meal_plan, authenticated_user):
        """Test updating meal type"""
        update_data = {
            "meal_type": "dinner"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert data["meal_type"] == "dinner"

    def test_update_meal_plan_change_date(self, client, sample_meal_plan, authenticated_user):
        """Test updating meal plan date"""
        update_data = {
            "date": "2024-02-01"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == "2024-02-01"

    def test_update_meal_plan_change_notes(self, client, sample_meal_plan, authenticated_user):
        """Test updating meal plan notes"""
        update_data = {
            "notes": "Updated notes for meal"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "Updated notes for meal"

    def test_update_meal_plan_multiple_fields(self, client, sample_meal_plan, authenticated_user):
        """Test updating multiple fields at once"""
        update_data = {
            "date": "2024-03-15",
            "meal_type": "snack",
            "notes": "Afternoon snack"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == "2024-03-15"
        assert data["meal_type"] == "snack"
        assert data["notes"] == "Afternoon snack"

    def test_update_meal_plan_invalid_meal_type(self, client, sample_meal_plan, authenticated_user):
        """Test updating with invalid meal type"""
        update_data = {
            "meal_type": "invalid_meal"
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    def test_update_meal_plan_nonexistent_recipe(self, client, sample_meal_plan, authenticated_user):
        """Test updating with non-existent recipe"""
        update_data = {
            "recipe_id": 99999
        }
        response = client.put(f"/api/meal-plans/{sample_meal_plan.id}", json=update_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_update_nonexistent_meal_plan(self, client, authenticated_user):
        """Test updating a meal plan that doesn't exist"""
        update_data = {
            "notes": "Updated notes"
        }
        response = client.put("/api/meal-plans/99999", json=update_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 404

    def test_delete_meal_plan(self, client, sample_meal_plan, authenticated_user):
        """Test deleting a meal plan"""
        response = client.delete(f"/api/meal-plans/{sample_meal_plan.id}", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 204

        # Verify it's deleted
        get_response = client.get(f"/api/meal-plans/{sample_meal_plan.id}", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert get_response.status_code == 404

    def test_delete_nonexistent_meal_plan(self, client, authenticated_user):
        """Test deleting a meal plan that doesn't exist"""
        response = client.delete("/api/meal-plans/99999", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 404

    def test_meal_plan_ordering(self, client, sample_recipe, authenticated_user):
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
            client.post("/api/meal-plans", json=meal_plan_data, headers={"Authorization": f"Bearer {authenticated_user['token']}"})

        # Get all meal plans
        response = client.get("/api/meal-plans", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
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

    def test_upload_image_success(self, client, sample_recipe, authenticated_user):
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
            files={"file": ("test_image.jpg", image_bytes, "image/jpeg")},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_recipe.id
        assert data["image_url"] is not None
        assert "/uploads/recipes/" in data["image_url"]
        assert data["image_url"].endswith(".jpg")

    def test_upload_image_recipe_not_found(self, client, authenticated_user):
        """Test uploading image for non-existent recipe"""
        import io
        from PIL import Image

        image = Image.new('RGB', (100, 100), color='red')
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='JPEG')
        image_bytes.seek(0)

        response = client.post(
            "/api/recipes/99999/upload-image",
            files={"file": ("test_image.jpg", image_bytes, "image/jpeg")},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        assert response.status_code == 404

    def test_upload_image_invalid_file_type(self, client, sample_recipe, authenticated_user):
        """Test uploading non-image file"""
        import io

        # Create a text file
        text_file = io.BytesIO(b"This is not an image")

        response = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("test.txt", text_file, "text/plain")},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
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

    def test_upload_png_image(self, client, sample_recipe, authenticated_user):
        """Test uploading PNG image"""
        import io
        from PIL import Image

        image = Image.new('RGBA', (100, 100), color=(0, 255, 0, 255))
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='PNG')
        image_bytes.seek(0)

        response = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("test_image.png", image_bytes, "image/png")},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["image_url"].endswith(".png")

    def test_upload_webp_image(self, client, sample_recipe, authenticated_user):
        """Test uploading WebP image"""
        import io
        from PIL import Image

        image = Image.new('RGB', (100, 100), color='yellow')
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='WEBP')
        image_bytes.seek(0)

        response = client.post(
            f"/api/recipes/{sample_recipe.id}/upload-image",
            files={"file": ("test_image.webp", image_bytes, "image/webp")},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["image_url"].endswith(".webp")

    def test_upload_image_replaces_previous(self, client, sample_recipe, authenticated_user):
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
            files={"file": ("image1.jpg", image_bytes1, "image/jpeg")},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
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
            files={"file": ("image2.jpg", image_bytes2, "image/jpeg")},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
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

    def test_search_by_title(self, client, sample_recipe, authenticated_user):
        """Test searching recipes by title"""
        # Make recipe public so it appears in search
        client.put(
            f"/api/recipes/{sample_recipe.id}",
            json={"instructions": sample_recipe.instructions, "is_public": True},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        response = client.get("/api/recipes/search?q=Pancakes", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(recipe["title"] == sample_recipe.title for recipe in data)

    def test_search_by_description(self, client, sample_recipe, authenticated_user):
        """Test searching recipes by description"""
        # Make recipe public so it appears in search
        client.put(
            f"/api/recipes/{sample_recipe.id}",
            json={"instructions": sample_recipe.instructions, "is_public": True},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        # Sample recipe has "Fluffy" in description
        response = client.get("/api/recipes/search?q=Fluffy", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_search_by_instructions(self, client, sample_recipe, authenticated_user):
        """Test searching recipes by instructions"""
        # Make recipe public so it appears in search
        client.put(
            f"/api/recipes/{sample_recipe.id}",
            json={"instructions": sample_recipe.instructions, "is_public": True},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        # Sample recipe has "griddle" in instructions
        response = client.get("/api/recipes/search?q=griddle", headers={"Authorization": f"Bearer {authenticated_user['token']}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_search_multiple_words(self, client, authenticated_user):
        """Test searching with multiple words"""
        # Create recipe with specific content
        recipe_data = {
            "title": "Italian Pasta Carbonara",
            "description": "Classic Italian pasta dish",
            "instructions": "Cook pasta, mix with eggs and cheese",
            "is_public": True,  # Make public so search can find it
            "ingredients": [
                {"name": "spaghetti", "amount": "1", "unit": "lb"},
                {"name": "eggs", "amount": "3", "unit": "whole"}
            ]
        }
        client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

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

    def test_search_ranking(self, client, authenticated_user):
        """Test that search results are ranked by relevance"""
        # Create recipes with varying relevance
        recipes = [
            {
                "title": "Chocolate Cake",
                "description": "Rich chocolate dessert",
                "instructions": "Bake chocolate cake",
                "is_public": True,
                "ingredients": [{"name": "chocolate", "amount": "2", "unit": "cups"}]
            },
            {
                "title": "Vanilla Cake",
                "description": "Contains some chocolate chips",
                "instructions": "Bake vanilla cake with chocolate chips",
                "is_public": True,
                "ingredients": [{"name": "chocolate chips", "amount": "1", "unit": "cup"}]
            },
            {
                "title": "Pancakes",
                "description": "Breakfast pancakes",
                "instructions": "Make pancakes for breakfast",
                "is_public": True,
                "ingredients": [{"name": "flour", "amount": "2", "unit": "cups"}]
            }
        ]

        for recipe in recipes:
            client.post(
                "/api/recipes",
                json=recipe,
                headers={"Authorization": f"Bearer {authenticated_user['token']}"}
            )

        # Search for "chocolate" - should rank Chocolate Cake higher
        response = client.get("/api/recipes/search?q=chocolate")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        # First result should be Chocolate Cake (most relevant)
        assert "Chocolate" in data[0]["title"]

    def test_search_partial_word(self, client, authenticated_user):
        """Test searching with partial words"""
        recipe_data = {
            "title": "Spaghetti Bolognese",
            "description": "Traditional Italian meat sauce",
            "instructions": "Cook spaghetti and prepare meat sauce",
            "is_public": True,
            "ingredients": [{"name": "spaghetti", "amount": "1", "unit": "lb"}]
        }
        client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        # Search for "spagh" should find "Spaghetti"
        response = client.get("/api/recipes/search?q=bologn")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1


class TestAuthentication:
    """Test suite for user authentication endpoints"""

    def test_register_new_user(self, client):
        """Test user registration with valid data"""
        user_data = {
            "email": "newuser@example.com",
            "password": "securepass123",
            "full_name": "New User"
        }
        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == 201
        data = response.json()

        # Check user data
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["full_name"] == "New User"
        assert data["user"]["is_active"] is True
        assert "id" in data["user"]

        # Check token
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    def test_register_duplicate_email(self, client):
        """Test registration with duplicate email fails"""
        user_data = {
            "email": "duplicate@example.com",
            "password": "password123"
        }

        # Register first user
        response1 = client.post("/api/auth/register", json=user_data)
        assert response1.status_code == 201

        # Try to register again with same email
        response2 = client.post("/api/auth/register", json=user_data)
        assert response2.status_code == 400
        assert "already registered" in response2.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        user_data = {
            "email": "notanemail",
            "password": "password123"
        }
        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 422  # Validation error

    def test_register_short_password(self, client):
        """Test registration with password less than 8 characters"""
        user_data = {
            "email": "short@example.com",
            "password": "short"
        }
        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 422  # Validation error

    def test_login_valid_credentials(self, client):
        """Test login with valid credentials"""
        # Register user first
        client.post("/api/auth/register", json={
            "email": "login@example.com",
            "password": "validpass123"
        })

        # Login
        response = client.post("/api/auth/login", json={
            "email": "login@example.com",
            "password": "validpass123"
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_password(self, client):
        """Test login with incorrect password"""
        # Register user
        client.post("/api/auth/register", json={
            "email": "wrongpass@example.com",
            "password": "correctpass123"
        })

        # Try login with wrong password
        response = client.post("/api/auth/login", json={
            "email": "wrongpass@example.com",
            "password": "wrongpassword"
        })

        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email"""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "somepassword"
        })

        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_get_current_user(self, client):
        """Test getting current user info with valid token"""
        # Register and get token
        register_response = client.post("/api/auth/register", json={
            "email": "getme@example.com",
            "password": "password123",
            "full_name": "Get Me User"
        })
        token = register_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "getme@example.com"
        assert data["full_name"] == "Get Me User"
        assert "id" in data

    def test_get_current_user_no_token(self, client):
        """Test accessing /me without authentication token"""
        response = client.get("/api/auth/me")
        assert response.status_code == 403  # Forbidden - no credentials

    def test_get_current_user_invalid_token(self, client):
        """Test accessing /me with invalid token"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401

    def test_create_recipe_requires_auth(self, client):
        """Test that creating a recipe requires authentication"""
        recipe_data = {
            "title": "Test Recipe",
            "instructions": "Cook it",
            "ingredients": [{"name": "Salt", "amount": "1", "unit": "tsp"}]
        }

        # Try without token
        response = client.post("/api/recipes", json=recipe_data)
        assert response.status_code == 403  # Forbidden

    def test_create_recipe_with_auth(self, client):
        """Test creating a recipe with valid authentication"""
        # Register and get token
        register_response = client.post("/api/auth/register", json={
            "email": "chef@example.com",
            "password": "chefpass123"
        })
        token = register_response.json()["access_token"]
        user_id = register_response.json()["user"]["id"]

        # Create recipe
        recipe_data = {
            "title": "Authenticated Recipe",
            "instructions": "Mix and cook",
            "ingredients": [{"name": "Flour", "amount": "2", "unit": "cups"}]
        }
        response = client.post(
            "/api/recipes",
            json=recipe_data,
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Authenticated Recipe"
        assert data["user_id"] == user_id

    def test_update_own_recipe(self, client):
        """Test that users can update their own recipes"""
        # Register and create recipe
        register_response = client.post("/api/auth/register", json={
            "email": "owner@example.com",
            "password": "ownerpass123"
        })
        token = register_response.json()["access_token"]

        # Create recipe
        create_response = client.post(
            "/api/recipes",
            json={"title": "My Recipe", "instructions": "Cook", "ingredients": []},
            headers={"Authorization": f"Bearer {token}"}
        )
        recipe_id = create_response.json()["id"]

        # Update recipe
        update_response = client.put(
            f"/api/recipes/{recipe_id}",
            json={"title": "Updated Recipe", "instructions": "Cook better", "ingredients": []},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert update_response.status_code == 200
        assert update_response.json()["title"] == "Updated Recipe"

    def test_cannot_update_others_recipe(self, client):
        """Test that users cannot update recipes owned by others"""
        # Register user 1 and create recipe
        user1_response = client.post("/api/auth/register", json={
            "email": "user1@example.com",
            "password": "pass12345"
        })
        user1_token = user1_response.json()["access_token"]

        create_response = client.post(
            "/api/recipes",
            json={"title": "User1 Recipe", "instructions": "Secret", "ingredients": []},
            headers={"Authorization": f"Bearer {user1_token}"}
        )
        recipe_id = create_response.json()["id"]

        # Register user 2
        user2_response = client.post("/api/auth/register", json={
            "email": "user2@example.com",
            "password": "pass12345"
        })
        user2_token = user2_response.json()["access_token"]

        # User 2 tries to update User 1's recipe
        update_response = client.put(
            f"/api/recipes/{recipe_id}",
            json={"title": "Hacked", "instructions": "Hacked", "ingredients": []},
            headers={"Authorization": f"Bearer {user2_token}"}
        )

        assert update_response.status_code == 403
        assert "permission" in update_response.json()["detail"].lower()

    def test_cannot_delete_others_recipe(self, client):
        """Test that users cannot delete recipes owned by others"""
        # Register user 1 and create recipe
        user1_response = client.post("/api/auth/register", json={
            "email": "creator@example.com",
            "password": "pass12345"
        })
        user1_token = user1_response.json()["access_token"]

        create_response = client.post(
            "/api/recipes",
            json={"title": "Protected Recipe", "instructions": "Private", "ingredients": []},
            headers={"Authorization": f"Bearer {user1_token}"}
        )
        recipe_id = create_response.json()["id"]

        # Register user 2
        user2_response = client.post("/api/auth/register", json={
            "email": "attacker@example.com",
            "password": "pass12345"
        })
        user2_token = user2_response.json()["access_token"]

        # User 2 tries to delete User 1's recipe
        delete_response = client.delete(
            f"/api/recipes/{recipe_id}",
            headers={"Authorization": f"Bearer {user2_token}"}
        )

        assert delete_response.status_code == 403
        assert "permission" in delete_response.json()["detail"].lower()

    def test_delete_own_recipe(self, client):
        """Test that users can delete their own recipes"""
        # Register and create recipe
        register_response = client.post("/api/auth/register", json={
            "email": "deleter@example.com",
            "password": "pass12345"
        })
        token = register_response.json()["access_token"]

        create_response = client.post(
            "/api/recipes",
            json={"title": "To Delete", "instructions": "Temp", "ingredients": []},
            headers={"Authorization": f"Bearer {token}"}
        )
        recipe_id = create_response.json()["id"]

        # Delete recipe
        delete_response = client.delete(
            f"/api/recipes/{recipe_id}",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert delete_response.status_code == 204


class TestAdminEndpoints:
    """Tests for admin API endpoints"""

    def test_get_admin_stats(self, client, authenticated_admin, sample_user, sample_recipe, sample_meal_plan, sample_category):
        """Test admin can get platform statistics"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.get("/api/admin/stats", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "active_users" in data
        assert "admin_users" in data
        assert "total_recipes" in data
        assert "total_meal_plans" in data
        assert "total_categories" in data
        assert data["total_users"] >= 2  # admin + sample_user
        assert data["total_recipes"] >= 1
        assert data["total_meal_plans"] >= 1
        assert data["total_categories"] >= 1

    def test_get_admin_stats_requires_admin(self, client, authenticated_user):
        """Test non-admin users cannot access stats"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = client.get("/api/admin/stats", headers=headers)
        
        assert response.status_code == 403
        assert "Admin privileges required" in response.json()["detail"]

    def test_list_all_users(self, client, authenticated_admin, sample_user):
        """Test admin can list all users"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.get("/api/admin/users", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2  # admin + sample_user
        assert any(u["email"] == "admin@example.com" for u in data)
        assert any(u["email"] == "testuser@example.com" for u in data)

    def test_list_users_with_pagination(self, client, authenticated_admin):
        """Test admin can list users with pagination"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.get("/api/admin/users?skip=0&limit=1", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_get_user_by_id(self, client, authenticated_admin, sample_user):
        """Test admin can get specific user details"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.get(f"/api/admin/users/{sample_user.id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "testuser@example.com"
        assert data["full_name"] == "Test User"
        assert "id" in data

    def test_get_nonexistent_user(self, client, authenticated_admin):
        """Test getting nonexistent user returns 404"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.get("/api/admin/users/99999", headers=headers)
        
        assert response.status_code == 404

    def test_update_user(self, client, authenticated_admin, sample_user):
        """Test admin can update user details"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        update_data = {
            "full_name": "Updated Name",
            "is_active": True
        }
        response = client.put(f"/api/admin/users/{sample_user.id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["is_active"] == True

    def test_update_user_email(self, client, authenticated_admin, sample_user):
        """Test admin can change user email"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        update_data = {
            "email": "newemail@example.com"
        }
        response = client.put(f"/api/admin/users/{sample_user.id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newemail@example.com"

    def test_update_user_duplicate_email(self, client, authenticated_admin, sample_user, second_user):
        """Test admin cannot change email to existing email"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        update_data = {
            "email": second_user.email  # Try to use second user's email
        }
        response = client.put(f"/api/admin/users/{sample_user.id}", json=update_data, headers=headers)
        
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_admin_cannot_deactivate_self(self, client, authenticated_admin, admin_user):
        """Test admin cannot deactivate their own account"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        update_data = {
            "is_active": False
        }
        response = client.put(f"/api/admin/users/{admin_user.id}", json=update_data, headers=headers)
        
        assert response.status_code == 400
        assert "Cannot deactivate yourself" in response.json()["detail"]

    def test_admin_cannot_remove_own_admin_privileges(self, client, authenticated_admin, admin_user):
        """Test admin cannot remove their own admin status"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        update_data = {
            "is_admin": False
        }
        response = client.put(f"/api/admin/users/{admin_user.id}", json=update_data, headers=headers)
        
        assert response.status_code == 400
        assert "Cannot remove your own admin privileges" in response.json()["detail"]

    def test_admin_can_grant_admin_privileges(self, client, authenticated_admin, sample_user):
        """Test admin can grant admin privileges to another user"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        update_data = {
            "is_admin": True
        }
        response = client.put(f"/api/admin/users/{sample_user.id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_admin"] == True

    def test_delete_user(self, client, authenticated_admin, second_user):
        """Test admin can delete users"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.delete(f"/api/admin/users/{second_user.id}", headers=headers)
        
        assert response.status_code == 204

        # Verify user is deleted
        get_response = client.get(f"/api/admin/users/{second_user.id}", headers=headers)
        assert get_response.status_code == 404

    def test_admin_cannot_delete_self(self, client, authenticated_admin, admin_user):
        """Test admin cannot delete their own account"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.delete(f"/api/admin/users/{admin_user.id}", headers=headers)
        
        assert response.status_code == 400
        assert "Cannot delete yourself" in response.json()["detail"]

    def test_admin_reset_user_password(self, client, authenticated_admin, sample_user):
        """Test admin can reset user password"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        new_password_data = {
            "new_password": "newpass12345"
        }
        response = client.post(
            f"/api/admin/users/{sample_user.id}/reset-password",
            json=new_password_data,
            headers=headers
        )
        
        assert response.status_code == 200
        assert "Password reset successfully" in response.json()["message"]

        # Verify user can login with new password
        login_response = client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "newpass12345"
        })
        assert login_response.status_code == 200

    def test_list_all_recipes_as_admin(self, client, authenticated_admin, sample_recipe):
        """Test admin can list all recipes"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.get("/api/admin/recipes", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(r["title"] == "Pancakes" for r in data)

    def test_delete_any_recipe_as_admin(self, client, authenticated_admin, sample_recipe):
        """Test admin can delete any recipe"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.delete(f"/api/admin/recipes/{sample_recipe.id}", headers=headers)
        
        assert response.status_code == 204

    def test_list_all_meal_plans_as_admin(self, client, authenticated_admin, sample_meal_plan):
        """Test admin can list all meal plans"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.get("/api/admin/meal-plans", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_delete_any_meal_plan_as_admin(self, client, authenticated_admin, sample_meal_plan):
        """Test admin can delete any meal plan"""
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.delete(f"/api/admin/meal-plans/{sample_meal_plan.id}", headers=headers)
        
        assert response.status_code == 204


class TestPasswordChange:
    """Tests for password change endpoint"""

    def test_change_password_success(self, client, authenticated_user):
        """Test user can change their own password"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        password_data = {
            "current_password": "testpass123",
            "new_password": "newpass12345"
        }
        response = client.post("/api/auth/change-password", json=password_data, headers=headers)
        
        assert response.status_code == 200
        assert "Password changed successfully" in response.json()["message"]

        # Verify can login with new password
        login_response = client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "newpass12345"
        })
        assert login_response.status_code == 200

    def test_change_password_wrong_current_password(self, client, authenticated_user):
        """Test password change fails with wrong current password"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpass12345"
        }
        response = client.post("/api/auth/change-password", json=password_data, headers=headers)
        
        assert response.status_code == 400
        assert "Current password is incorrect" in response.json()["detail"]

    def test_change_password_requires_auth(self, client):
        """Test password change requires authentication"""
        password_data = {
            "current_password": "testpass123",
            "new_password": "newpass12345"
        }
        response = client.post("/api/auth/change-password", json=password_data)
        
        assert response.status_code == 403  # FastAPI returns 403 for missing auth


class TestCascadeDelete:
    """Tests for cascade delete when deleting users"""

    def test_delete_user_cascades_to_recipes(self, client, authenticated_admin, sample_user, sample_recipe, db_session):
        """Test deleting user also deletes their recipes"""
        from models import Recipe
        
        # Verify recipe exists
        recipe_count_before = db_session.query(Recipe).filter(Recipe.user_id == sample_user.id).count()
        assert recipe_count_before >= 1

        # Delete user
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.delete(f"/api/admin/users/{sample_user.id}", headers=headers)
        assert response.status_code == 204

        # Verify recipes are deleted
        recipe_count_after = db_session.query(Recipe).filter(Recipe.user_id == sample_user.id).count()
        assert recipe_count_after == 0

    def test_delete_user_cascades_to_categories(self, client, authenticated_admin, sample_user, sample_category, db_session):
        """Test deleting user also deletes their categories"""
        from models import Category
        
        # Verify category exists
        category_count_before = db_session.query(Category).filter(Category.user_id == sample_user.id).count()
        assert category_count_before >= 1

        # Delete user
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.delete(f"/api/admin/users/{sample_user.id}", headers=headers)
        assert response.status_code == 204

        # Verify categories are deleted
        category_count_after = db_session.query(Category).filter(Category.user_id == sample_user.id).count()
        assert category_count_after == 0

    def test_delete_user_cascades_to_meal_plans(self, client, authenticated_admin, sample_user, sample_meal_plan, db_session):
        """Test deleting user also deletes their meal plans"""
        from models import MealPlan
        
        # Verify meal plan exists
        meal_plan_count_before = db_session.query(MealPlan).filter(MealPlan.user_id == sample_user.id).count()
        assert meal_plan_count_before >= 1

        # Delete user
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.delete(f"/api/admin/users/{sample_user.id}", headers=headers)
        assert response.status_code == 204

        # Verify meal plans are deleted
        meal_plan_count_after = db_session.query(MealPlan).filter(MealPlan.user_id == sample_user.id).count()
        assert meal_plan_count_after == 0

    def test_delete_user_with_all_data(self, client, authenticated_admin, sample_user, sample_recipe, sample_category, sample_meal_plan, db_session):
        """Test deleting user removes all associated data (recipes, categories, meal plans)"""
        from models import Recipe, Category, MealPlan
        
        user_id = sample_user.id

        # Verify all data exists
        assert db_session.query(Recipe).filter(Recipe.user_id == user_id).count() >= 1
        assert db_session.query(Category).filter(Category.user_id == user_id).count() >= 1
        assert db_session.query(MealPlan).filter(MealPlan.user_id == user_id).count() >= 1

        # Delete user
        headers = {"Authorization": f"Bearer {authenticated_admin['token']}"}
        response = client.delete(f"/api/admin/users/{user_id}", headers=headers)
        assert response.status_code == 204

        # Verify all associated data is deleted
        assert db_session.query(Recipe).filter(Recipe.user_id == user_id).count() == 0
        assert db_session.query(Category).filter(Category.user_id == user_id).count() == 0
        assert db_session.query(MealPlan).filter(MealPlan.user_id == user_id).count() == 0
