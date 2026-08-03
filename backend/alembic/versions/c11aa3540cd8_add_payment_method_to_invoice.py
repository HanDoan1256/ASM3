"""add payment method to invoice

Revision ID: c11aa3540cd8
Revises: 20260802_tracking_status
Create Date: 2026-08-03
"""

from alembic import op
import sqlalchemy as sa


revision = "c11aa3540cd8"
down_revision = "20260802_tracking_status"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "invoice",
        sa.Column(
            "payment_method",
            sa.String(length=50),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("invoice", "payment_method")