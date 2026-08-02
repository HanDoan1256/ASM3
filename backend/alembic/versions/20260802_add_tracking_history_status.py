"""Add historical status to tracking events.

Revision ID: 20260802_tracking_status
Revises:
"""

from alembic import op
import sqlalchemy as sa


revision = "20260802_tracking_status"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tracking_history", sa.Column("status", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("tracking_history", "status")
