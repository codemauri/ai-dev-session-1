# API Documentation - Recipe Manager

## Overview

The Recipe Manager API is a RESTful service built with FastAPI that provides endpoints for managing recipes, categories, and ingredients.

**Base URL:** `http://localhost:8000`
**Interactive API Docs:** `http://localhost:8000/docs` (Swagger UI)
**Alternative Docs:** `http://localhost:8000/redoc` (ReDoc)

---

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

---

## Endpoints

### Health Check

#### GET `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy"
}
```

---

## Categories

### Get All Categories

#### GET `/api/categories`

Retrieve all recipe categories.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Breakfast",
    "description": "Morning meals"
  }
]
```

### Create Category

#### POST `/api/categories`

Create a new recipe category.

**Request Body:**
```json
{
  "name": "Desserts",
  "description": "Sweet treats"  // optional
}
```

**Response:** `200 OK`
```json
{
  "id": 3,
  "name": "Desserts",
  "description": "Sweet treats"
}
```

### Get Category by ID

#### GET `/api/categories/{id}`

Get a specific category by ID.

**Path Parameters:**
- `id` (integer, required) - Category ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Breakfast",
  "description": "Morning meals"
}
```

**Error Response:** `404 Not Found`
```json
{
  "detail": "Category not found"
}
```

### Update Category

#### PUT `/api/categories/{id}`

Update an existing category.

**Path Parameters:**
- `id` (integer, required) - Category ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Category

#### DELETE `/api/categories/{id}`

Delete a category.

**Path Parameters:**
- `id` (integer, required) - Category ID

**Response:** `200 OK`
```json
{
  "message": "Category deleted successfully"
}
```

---

## Recipes

### Get All Recipes

#### GET `/api/recipes`

Retrieve all recipes with optional filtering.

**Query Parameters:**
- `category_id` (integer, optional) - Filter recipes by category ID

**Examples:**
- Get all recipes: `GET /api/recipes`
- Filter by category: `GET /api/recipes?category_id=1`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Pancakes",
    "description": "Fluffy breakfast pancakes",
    "instructions": "Mix ingredients and cook on griddle",
    "prep_time": 10,
    "cook_time": 15,
    "servings": 4,
    "category_id": 1,
    "category": {
      "id": 1,
      "name": "Breakfast",
      "description": "Morning meals"
    },
    "ingredients": [
      {
        "id": 1,
        "recipe_id": 1,
        "name": "Flour",
        "amount": "2",
        "unit": "cups"
      }
    ],
    "created_at": "2025-11-10T10:00:00",
    "updated_at": "2025-11-10T10:00:00"
  }
]
```

### Create Recipe

#### POST `/api/recipes`

Create a new recipe with ingredients.

**Request Body:**
```json
{
  "title": "Chocolate Chip Cookies",
  "description": "Delicious homemade cookies",  // optional
  "instructions": "Mix, bake, enjoy",  // optional
  "prep_time": 15,  // optional, in minutes
  "cook_time": 12,  // optional, in minutes
  "servings": 24,  // optional
  "category_id": 2,  // optional
  "ingredients": [
    {
      "name": "Flour",
      "amount": "2",
      "unit": "cups"
    },
    {
      "name": "Sugar",
      "amount": "1",
      "unit": "cup"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": 2,
  "title": "Chocolate Chip Cookies",
  "description": "Delicious homemade cookies",
  "instructions": "Mix, bake, enjoy",
  "prep_time": 15,
  "cook_time": 12,
  "servings": 24,
  "category_id": 2,
  "category": {
    "id": 2,
    "name": "Desserts",
    "description": "Sweet treats"
  },
  "ingredients": [
    {
      "id": 3,
      "recipe_id": 2,
      "name": "Flour",
      "amount": "2",
      "unit": "cups"
    },
    {
      "id": 4,
      "recipe_id": 2,
      "name": "Sugar",
      "amount": "1",
      "unit": "cup"
    }
  ],
  "created_at": "2025-11-10T11:00:00",
  "updated_at": "2025-11-10T11:00:00"
}
```

### Get Recipe by ID

#### GET `/api/recipes/{id}`

Get a specific recipe with all its ingredients.

**Path Parameters:**
- `id` (integer, required) - Recipe ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Pancakes",
  "description": "Fluffy breakfast pancakes",
  "instructions": "Mix ingredients and cook on griddle",
  "prep_time": 10,
  "cook_time": 15,
  "servings": 4,
  "category_id": 1,
  "category": {
    "id": 1,
    "name": "Breakfast",
    "description": "Morning meals"
  },
  "ingredients": [
    {
      "id": 1,
      "recipe_id": 1,
      "name": "Flour",
      "amount": "2",
      "unit": "cups"
    }
  ],
  "created_at": "2025-11-10T10:00:00",
  "updated_at": "2025-11-10T10:00:00"
}
```

**Error Response:** `404 Not Found`
```json
{
  "detail": "Recipe not found"
}
```

### Update Recipe

#### PUT `/api/recipes/{id}`

Update an existing recipe. This replaces all ingredients with the new list.

**Path Parameters:**
- `id` (integer, required) - Recipe ID

**Request Body:**
```json
{
  "title": "Super Pancakes",  // optional
  "description": "Even fluffier",  // optional
  "instructions": "Updated instructions",  // optional
  "prep_time": 12,  // optional
  "cook_time": 15,  // optional
  "servings": 6,  // optional
  "category_id": 1,  // optional
  "ingredients": [  // optional, replaces all existing ingredients
    {
      "name": "Flour",
      "amount": "3",
      "unit": "cups"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Super Pancakes",
  "description": "Even fluffier",
  "instructions": "Updated instructions",
  "prep_time": 12,
  "cook_time": 15,
  "servings": 6,
  "category_id": 1,
  "category": {
    "id": 1,
    "name": "Breakfast",
    "description": "Morning meals"
  },
  "ingredients": [
    {
      "id": 5,
      "recipe_id": 1,
      "name": "Flour",
      "amount": "3",
      "unit": "cups"
    }
  ],
  "created_at": "2025-11-10T10:00:00",
  "updated_at": "2025-11-10T12:00:00"
}
```

### Delete Recipe

#### DELETE `/api/recipes/{id}`

Delete a recipe and all its ingredients.

**Path Parameters:**
- `id` (integer, required) - Recipe ID

**Response:** `200 OK`
```json
{
  "message": "Recipe deleted successfully"
}
```

---

## Data Models

### Category

| Field       | Type   | Required | Description              |
|-------------|--------|----------|--------------------------|
| id          | int    | Auto     | Unique identifier        |
| name        | string | Yes      | Category name            |
| description | string | No       | Category description     |

### Ingredient

| Field     | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| id        | int    | Auto     | Unique identifier        |
| recipe_id | int    | Auto     | Associated recipe ID     |
| name      | string | Yes      | Ingredient name          |
| amount    | string | Yes      | Quantity (e.g., "2")     |
| unit      | string | Yes      | Unit (e.g., "cups")      |

### Recipe

| Field        | Type       | Required | Description              |
|--------------|------------|----------|--------------------------|
| id           | int        | Auto     | Unique identifier        |
| title        | string     | Yes      | Recipe name              |
| description  | string     | No       | Brief description        |
| instructions | string     | No       | Cooking steps            |
| prep_time    | int        | No       | Prep time in minutes     |
| cook_time    | int        | No       | Cook time in minutes     |
| servings     | int        | No       | Number of servings       |
| category_id  | int        | No       | Associated category ID   |
| category     | Category   | Auto     | Category object          |
| ingredients  | Ingredient | Auto     | List of ingredients      |
| created_at   | datetime   | Auto     | Creation timestamp       |
| updated_at   | datetime   | Auto     | Last update timestamp    |

---

## Error Responses

### 400 Bad Request

Invalid request data or validation error.

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 404 Not Found

Resource not found.

```json
{
  "detail": "Recipe not found"
}
```

### 500 Internal Server Error

Server error.

```json
{
  "detail": "Internal server error"
}
```

---

## Examples

### Creating a Complete Recipe

```bash
curl -X POST "http://localhost:8000/api/recipes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spaghetti Carbonara",
    "description": "Classic Italian pasta",
    "instructions": "1. Cook pasta\n2. Fry bacon\n3. Mix eggs and cheese\n4. Combine all",
    "prep_time": 10,
    "cook_time": 20,
    "servings": 4,
    "category_id": 1,
    "ingredients": [
      {"name": "Spaghetti", "amount": "400", "unit": "grams"},
      {"name": "Bacon", "amount": "200", "unit": "grams"},
      {"name": "Eggs", "amount": "4", "unit": "whole"},
      {"name": "Parmesan", "amount": "100", "unit": "grams"}
    ]
  }'
```

### Filtering Recipes by Category

```bash
curl "http://localhost:8000/api/recipes?category_id=1"
```

### Updating a Recipe

```bash
curl -X PUT "http://localhost:8000/api/recipes/1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Spaghetti Carbonara",
    "prep_time": 15
  }'
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. This may be added in future versions.

---

## Versioning

**Current Version:** v1 (implicit)
**API Stability:** Development (subject to change)

Future versions may be prefixed with `/api/v2/` etc.

---

## Support

For issues and questions:
- GitHub Issues: [Repository Issues](https://github.com/codemauri/ai-dev-session-1/issues)
- Interactive Docs: http://localhost:8000/docs
