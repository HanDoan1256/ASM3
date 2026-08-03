"""align resource status constraints

Revision ID: 6194f60bae7c
Revises: f32e9a940f4a
Create Date: 2026-08-03 13:47:21.618870
"""
from alembic import op
import sqlalchemy as sa



# revision identifiers, used by Alembic.
revision = '6194f60bae7c'
down_revision = 'f32e9a940f4a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Driver
    op.drop_constraint(
        "driver_status_check",
        "driver",
        type_="check",
    )

    op.create_check_constraint(
        "driver_status_check",
        "driver",
        """
        status IN (
            'Available',
            'Assigned',
            'In Transit',
            'Maintenance'
        )
        """,
    )

    # Vehicle
    op.drop_constraint(
        "vehicle_status_check",
        "vehicle",
        type_="check",
    )

    op.create_check_constraint(
        "vehicle_status_check",
        "vehicle",
        """
        status IN (
            'Available',
            'Assigned',
            'In Transit',
            'Maintenance'
        )
        """,
    )


def downgrade() -> None:
    # Convert new lifecycle statuses back to legacy Busy
    # before restoring the old constraints.
    op.execute("""
        UPDATE driver
        SET status = 'Busy'
        WHERE status IN ('Assigned', 'In Transit')
    """)

    op.execute("""
        UPDATE vehicle
        SET status = 'Busy'
        WHERE status IN ('Assigned', 'In Transit')
    """)

    op.drop_constraint(
        "driver_status_check",
        "driver",
        type_="check",
    )

    op.create_check_constraint(
        "driver_status_check",
        "driver",
        """
        status IN (
            'Available',
            'Busy',
            'Maintenance'
        )
        """,
    )

    op.drop_constraint(
        "vehicle_status_check",
        "vehicle",
        type_="check",
    )

    op.create_check_constraint(
        "vehicle_status_check",
        "vehicle",
        """
        status IN (
            'Available',
            'Busy',
            'Maintenance'
        )
        """,
    )
