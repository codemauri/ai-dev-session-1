# Database Schema - Recipe Manager

This document describes the database schema for the Recipe Manager application.

---

## Overview

The Recipe Manager uses a **PostgreSQL 16** database with three main tables:
- **categories** - Recipe categories (e.g., Breakfast, Lunch, Dinner)
- **recipes** - Recipe information (title, instructions, times, servings)
- **ingredients** - Recipe ingredients with amounts and units

---

## Entity Relationship Diagram (ASCII)

```
┌─────────────────┐
│   categories    │
├─────────────────┤
│ id (PK)         │───┐
│ name            │   │
│ description     │   │
└─────────────────┘   │
                      │
                      │ 1:N (One category has many recipes)
                      │
                      ▼
                ┌─────────────────┐
                │     recipes     │
                ├─────────────────┤
                │ id (PK)         │───┐
                │ title           │   │
                │ description     │   │
                │ instructions    │   │
                │ prep_time       │   │
                │ cook_time       │   │
                │ servings        │   │
                │ category_id (FK)│◄──┘
                │ created_at      │
                │ updated_at      │
                └─────────────────┘
                       │
                       │ 1:N (One recipe has many ingredients)
                       │
                       ▼
                 ┌──────────────┐
                 │ ingredients  │
                 ├──────────────┤
                 │ id (PK)      │
                 │ recipe_id(FK)│
                 │ name         │
                 │ amount       │
                 │ unit         │
                 └──────────────┘

Legend:
  PK  = Primary Key
  FK  = Foreign Key
  1:N = One-to-Many Relationship
```

---

## Table Definitions

### 1. categories

Stores recipe categories for organization.

| Column      | Type         | Nullable | Default | Description                |
|-------------|--------------|----------|---------|----------------------------|
| id          | INTEGER      | NO       | AUTO    | Primary key                |
| name        | VARCHAR      | NO       | -       | Category name              |
| description | VARCHAR      | YES      | NULL    | Optional category description |

**Indexes:**
- PRIMARY KEY on `id`

**Example Data:**
```sql
INSERT INTO categories (name, description) VALUES
  ('Breakfast', 'Morning meals'),
  ('Lunch', 'Midday meals'),
  ('Dinner', 'Evening meals'),
  ('Desserts', 'Sweet treats');
```

---

### 2. recipes

Stores recipe information including title, instructions, and timing.

| Column       | Type         | Nullable | Default             | Description                    |
|--------------|--------------|----------|---------------------|--------------------------------|
| id           | INTEGER      | NO       | AUTO                | Primary key                    |
| title        | VARCHAR      | NO       | -                   | Recipe name                    |
| description  | VARCHAR      | YES      | NULL                | Brief recipe description       |
| instructions | TEXT         | YES      | NULL                | Step-by-step cooking instructions |
| prep_time    | INTEGER      | YES      | NULL                | Preparation time (minutes)     |
| cook_time    | INTEGER      | YES      | NULL                | Cooking time (minutes)         |
| servings     | INTEGER      | YES      | NULL                | Number of servings             |
| category_id  | INTEGER      | YES      | NULL                | Foreign key to categories      |
| created_at   | TIMESTAMP    | NO       | CURRENT_TIMESTAMP   | Record creation time           |
| updated_at   | TIMESTAMP    | NO       | CURRENT_TIMESTAMP   | Last update time               |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `category_id` references `categories(id)`
- INDEX on `category_id` (for filtering)

**Example Data:**
```sql
INSERT INTO recipes (title, description, instructions, prep_time, cook_time, servings, category_id) VALUES
  (
    'Pancakes',
    'Fluffy breakfast pancakes',
    'Mix ingredients. Cook on griddle until bubbles form.',
    10,
    15,
    4,
    1
  );
```

---

### 3. ingredients

Stores ingredients for each recipe with amounts and units.

| Column    | Type         | Nullable | Default | Description                |
|-----------|--------------|----------|---------|----------------------------|
| id        | INTEGER      | NO       | AUTO    | Primary key                |
| recipe_id | INTEGER      | NO       | -       | Foreign key to recipes     |
| name      | VARCHAR      | NO       | -       | Ingredient name            |
| amount    | VARCHAR      | NO       | -       | Quantity (e.g., "2", "1.5") |
| unit      | VARCHAR      | NO       | -       | Unit (e.g., "cups", "tsp") |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `recipe_id` references `recipes(id)` ON DELETE CASCADE
- INDEX on `recipe_id` (for querying ingredients by recipe)

**Cascade Delete:** When a recipe is deleted, all its ingredients are automatically deleted.

**Example Data:**
```sql
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES
  (1, 'Flour', '2', 'cups'),
  (1, 'Milk', '1.5', 'cups'),
  (1, 'Eggs', '2', 'whole'),
  (1, 'Sugar', '2', 'tablespoons');
```

---

## Relationships

### Category → Recipe (One-to-Many)

- One category can have many recipes
- A recipe can belong to zero or one category
- Foreign key: `recipes.category_id` → `categories.id`
- **Optional relationship** (recipe can exist without a category)

**SQL:**
```sql
-- Get all recipes in a category
SELECT * FROM recipes WHERE category_id = 1;

-- Get recipe with its category
SELECT r.*, c.name as category_name
FROM recipes r
LEFT JOIN categories c ON r.category_id = c.id
WHERE r.id = 1;
```

### Recipe → Ingredient (One-to-Many)

- One recipe can have many ingredients
- Each ingredient belongs to exactly one recipe
- Foreign key: `ingredients.recipe_id` → `recipes.id`
- **CASCADE DELETE**: Deleting a recipe deletes all its ingredients

**SQL:**
```sql
-- Get all ingredients for a recipe
SELECT * FROM ingredients WHERE recipe_id = 1;

-- Delete recipe (also deletes ingredients)
DELETE FROM recipes WHERE id = 1;
```

---

## Database Migration Files

Migrations are managed with Alembic. Migration files are located in:
```
backend/alembic/versions/
```

### Creating Migrations

```bash
# Auto-generate migration from model changes
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback one migration
docker compose exec backend alembic downgrade -1
```

---

## Sample Queries

### Get Recipe with All Details

```sql
SELECT
  r.id,
  r.title,
  r.description,
  r.instructions,
  r.prep_time,
  r.cook_time,
  r.servings,
  c.name as category_name,
  json_agg(
    json_build_object(
      'name', i.name,
      'amount', i.amount,
      'unit', i.unit
    )
  ) as ingredients
FROM recipes r
LEFT JOIN categories c ON r.category_id = c.id
LEFT JOIN ingredients i ON i.recipe_id = r.id
WHERE r.id = 1
GROUP BY r.id, c.name;
```

### Search Recipes by Ingredient

```sql
SELECT DISTINCT r.*
FROM recipes r
JOIN ingredients i ON i.recipe_id = r.id
WHERE i.name ILIKE '%chicken%';
```

### Get Recipes by Prep Time Range

```sql
SELECT * FROM recipes
WHERE prep_time BETWEEN 10 AND 30
ORDER BY prep_time ASC;
```

### Get Most Popular Categories

```sql
SELECT
  c.name,
  COUNT(r.id) as recipe_count
FROM categories c
LEFT JOIN recipes r ON r.category_id = c.id
GROUP BY c.id, c.name
ORDER BY recipe_count DESC;
```

---

## Database Connection

**Connection String (Docker):**
```
postgresql+psycopg://recipe_user:recipe_password@db:5432/recipe_db
```

**Connection Parameters:**
- Host: `db` (Docker service name) or `localhost` (local)
- Port: `5432`
- Database: `recipe_db`
- User: `recipe_user`
- Password: `recipe_password`
- Driver: `psycopg` (psycopg3 for Python 3.13 compatibility)

---

## Data Validation

### Application Level (Pydantic)

Validation is enforced in `backend/schemas.py`:

```python
class RecipeCreate(BaseModel):
    title: str  # Required, min 1 character
    description: Optional[str] = None
    instructions: Optional[str] = None
    prep_time: Optional[int] = None  # Must be positive if provided
    cook_time: Optional[int] = None  # Must be positive if provided
    servings: Optional[int] = None  # Must be positive if provided
    category_id: Optional[int] = None
    ingredients: List[IngredientCreate]
```

### Database Level (Constraints)

- NOT NULL constraints on required fields
- Foreign key constraints ensure referential integrity
- Automatic timestamps with `created_at` and `updated_at`

---

## Performance Considerations

### Current Optimizations

1. **Indexes on Foreign Keys:**
   - `recipes.category_id` - Fast category filtering
   - `ingredients.recipe_id` - Fast ingredient lookups

2. **Cascade Deletes:**
   - Automatically removes related ingredients when recipe is deleted
   - Prevents orphaned records

3. **Connection Pooling:**
   - SQLAlchemy manages database connection pool
   - Reduces connection overhead

### Future Optimizations

1. **Full-Text Search:**
   ```sql
   -- Add tsvector column for full-text search
   ALTER TABLE recipes ADD COLUMN search_vector tsvector;
   CREATE INDEX recipes_search_idx ON recipes USING gin(search_vector);
   ```

2. **Materialized Views:**
   - Pre-compute expensive aggregations
   - Example: Recipe counts per category

3. **Partitioning:**
   - Partition recipes by created_at date
   - Useful when dataset grows large

---

## Backup and Restore

### Backup Database

```bash
# Backup all data
docker compose exec db pg_dump -U recipe_user recipe_db > backup.sql

# Backup with Docker volume
docker run --rm \
  -v ai-dev-session-1_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz /data
```

### Restore Database

```bash
# Restore from SQL dump
docker compose exec -T db psql -U recipe_user recipe_db < backup.sql

# Restore Docker volume
docker run --rm \
  -v ai-dev-session-1_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/db-backup.tar.gz -C /
```

---

## Schema Version History

| Version | Date       | Changes                          | Migration File |
|---------|------------|----------------------------------|----------------|
| 1.0     | 2025-11-10 | Initial schema creation          | (auto)         |

---

## Tools for Visualization

To generate visual diagrams from this schema:

1. **ERD Tools:**
   - [dbdiagram.io](https://dbdiagram.io) - Paste SQL, get diagram
   - [DBeaver](https://dbeaver.io/) - Free database tool with ER diagrams
   - [pgAdmin](https://www.pgadmin.org/) - PostgreSQL admin tool

2. **Command-line:**
   ```bash
   # Install postgresql-autodoc
   sudo apt install postgresql-autodoc

   # Generate diagram
   postgresql_autodoc -d recipe_db -u recipe_user
   ```

3. **Python (SchemaSpy):**
   ```bash
   # Generate interactive HTML documentation
   docker run -v "$PWD:/output" \
     schemaspy/schemaspy:latest \
     -t pgsql -host db -db recipe_db -u recipe_user -p recipe_password
   ```

---

For more details, see:
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API endpoints
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
