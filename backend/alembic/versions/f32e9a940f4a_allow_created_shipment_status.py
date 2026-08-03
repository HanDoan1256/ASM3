from alembic import op


revision = "f32e9a940f4a"
down_revision = "c11aa3540cd8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "shipment_shipment_status_check",
        "shipment",
        type_="check",
    )

    op.create_check_constraint(
        "shipment_shipment_status_check",
        "shipment",
        """
        shipment_status IN (
            'Created',
            'Assigned',
            'In Transit',
            'Out for Delivery',
            'Pending Customs',
            'Delivered',
            'Failed'
        )
        """,
    )


def downgrade() -> None:
    op.drop_constraint(
        "shipment_shipment_status_check",
        "shipment",
        type_="check",
    )

    op.create_check_constraint(
        "shipment_shipment_status_check",
        "shipment",
        """
        shipment_status IN (
            'Assigned',
            'In Transit',
            'Out for Delivery',
            'Pending Customs',
            'Delivered',
            'Failed'
        )
        """,
    )