"""add_user_id_to_categories

Revision ID: 5b3d0893e9ef
Revises: cc73295af993
Create Date: 2025-11-17 21:02:58.795506

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b3d0893e9ef'
down_revision: Union[str, Sequence[str], None] = 'cc73295af993'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add user_id column as nullable first
    op.add_column('categories', sa.Column('user_id', sa.Integer(), nullable=True))

    # Assign all existing categories to the admin user (ID 3)
    op.execute("UPDATE categories SET user_id = 3 WHERE user_id IS NULL")

    # Now make the column non-nullable
    op.alter_column('categories', 'user_id', nullable=False)

    # Drop the unique constraint on name field (users can have same category names)
    op.drop_index('ix_categories_name', table_name='categories')

    # Recreate the index without unique constraint
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=False)

    # Add foreign key constraint
    op.create_foreign_key('categories_user_id_fkey', 'categories', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Remove foreign key
    op.drop_constraint('categories_user_id_fkey', 'categories', type_='foreignkey')

    # Drop the non-unique index
    op.drop_index(op.f('ix_categories_name'), table_name='categories')

    # Recreate unique index on name
    op.create_index('ix_categories_name', 'categories', ['name'], unique=True)

    # Remove user_id column
    op.drop_column('categories', 'user_id')
