"""add_is_admin_to_users

Revision ID: cc73295af993
Revises: 1c9fb93ec4c5
Create Date: 2025-11-17 17:13:02.078731

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc73295af993'
down_revision: Union[str, Sequence[str], None] = '1c9fb93ec4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_admin column with default False
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove is_admin column
    op.drop_column('users', 'is_admin')
