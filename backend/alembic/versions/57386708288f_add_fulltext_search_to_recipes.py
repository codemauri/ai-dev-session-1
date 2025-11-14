"""add_fulltext_search_to_recipes

Revision ID: 57386708288f
Revises: 4408e612ad04
Create Date: 2025-11-13 22:25:02.414302

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '57386708288f'
down_revision: Union[str, Sequence[str], None] = '4408e612ad04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add tsvector column for full-text search
    op.execute("""
        ALTER TABLE recipes
        ADD COLUMN search_vector tsvector
    """)

    # Create GIN index for fast full-text search
    op.execute("""
        CREATE INDEX idx_recipes_search_vector
        ON recipes USING GIN(search_vector)
    """)

    # Create function to update search_vector
    # This aggregates text from recipe, ingredients, and instructions
    op.execute("""
        CREATE OR REPLACE FUNCTION recipes_search_vector_update()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(NEW.instructions, '')), 'C') ||
                setweight(to_tsvector('english', COALESCE(
                    (SELECT string_agg(name || ' ' || COALESCE(amount, '') || ' ' || COALESCE(unit, ''), ' ')
                     FROM ingredients
                     WHERE recipe_id = NEW.id),
                '')), 'D');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create trigger to automatically update search_vector
    op.execute("""
        CREATE TRIGGER recipes_search_vector_trigger
        BEFORE INSERT OR UPDATE ON recipes
        FOR EACH ROW
        EXECUTE FUNCTION recipes_search_vector_update()
    """)

    # Update existing recipes with search vectors
    op.execute("""
        UPDATE recipes SET search_vector =
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(instructions, '')), 'C')
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS recipes_search_vector_trigger ON recipes")

    # Drop function
    op.execute("DROP FUNCTION IF EXISTS recipes_search_vector_update()")

    # Drop index
    op.execute("DROP INDEX IF EXISTS idx_recipes_search_vector")

    # Drop column
    op.execute("ALTER TABLE recipes DROP COLUMN IF EXISTS search_vector")
