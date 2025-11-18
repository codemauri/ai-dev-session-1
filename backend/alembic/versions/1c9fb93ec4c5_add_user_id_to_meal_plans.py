"""add_user_id_to_meal_plans

Revision ID: 1c9fb93ec4c5
Revises: 2dfa3280d675
Create Date: 2025-11-17 16:28:16.845930

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c9fb93ec4c5'
down_revision: Union[str, Sequence[str], None] = '2dfa3280d675'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add user_id column as nullable first
    op.add_column('meal_plans', sa.Column('user_id', sa.Integer(), nullable=True))

    # Set existing meal plans to a default user (ID 3 = semjase77@gmail.com)
    # This assumes user ID 3 exists. If not, existing meal plans will remain null.
    op.execute("UPDATE meal_plans SET user_id = 3 WHERE user_id IS NULL")

    # Now make the column non-nullable
    op.alter_column('meal_plans', 'user_id', nullable=False)

    # Add foreign key constraint
    op.create_foreign_key('meal_plans_user_id_fkey', 'meal_plans', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key constraint
    op.drop_constraint('meal_plans_user_id_fkey', 'meal_plans', type_='foreignkey')

    # Drop user_id column
    op.drop_column('meal_plans', 'user_id')
