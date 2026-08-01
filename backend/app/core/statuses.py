from __future__ import annotations

from collections.abc import Mapping


ORDER_PENDING = "Pending"
ORDER_APPROVED = "Approved"
ORDER_IN_TRANSIT = "In Transit"
ORDER_DELIVERED = "Delivered"
ORDER_CANCELLED = "Cancelled"

SHIPMENT_CREATED = "Created"
SHIPMENT_ASSIGNED = "Assigned"
SHIPMENT_PICKED_UP = "Picked Up"
SHIPMENT_IN_TRANSIT = "In Transit"
SHIPMENT_DELIVERED = "Delivered"

PAYMENT_PENDING = "Pending"
PAYMENT_COMPLETED = "Completed"
PAYMENT_FAILED = "Failed"
PAYMENT_CANCELLED = "Cancelled"

RESOURCE_AVAILABLE = "Available"
RESOURCE_ASSIGNED = "Assigned"
RESOURCE_IN_TRANSIT = "In Transit"

# Payment responsibility/method chosen by the customer during order creation.
PAYMENT_METHOD_SENDER_COD = "SENDER_COD"
PAYMENT_METHOD_RECEIVER_COD = "RECEIVER_COD"
PAYMENT_METHOD_SENDER_TRANSFER = "SENDER_TRANSFER"

PAYMENT_METHODS = {
    PAYMENT_METHOD_SENDER_COD,
    PAYMENT_METHOD_RECEIVER_COD,
    PAYMENT_METHOD_SENDER_TRANSFER,
}

ORDER_STATUSES = {
    ORDER_PENDING,
    ORDER_APPROVED,
    ORDER_IN_TRANSIT,
    ORDER_DELIVERED,
    ORDER_CANCELLED,
}

SHIPMENT_STATUSES = {
    SHIPMENT_CREATED,
    SHIPMENT_ASSIGNED,
    SHIPMENT_PICKED_UP,
    SHIPMENT_IN_TRANSIT,
    SHIPMENT_DELIVERED,
}

TRACKING_STATUSES = set(SHIPMENT_STATUSES)

PAYMENT_STATUSES = {
    PAYMENT_PENDING,
    PAYMENT_COMPLETED,
    PAYMENT_FAILED,
    PAYMENT_CANCELLED,
}

RESOURCE_STATUSES = {
    RESOURCE_AVAILABLE,
    RESOURCE_ASSIGNED,
    RESOURCE_IN_TRANSIT,
}

# Invoice status reuses the payment status vocabulary: an invoice starts Pending
# and becomes Completed once a payment is confirmed (or Cancelled if the order is cancelled).
INVOICE_STATUSES = set(PAYMENT_STATUSES)

ORDER_TRANSITIONS: dict[str, set[str]] = {
    ORDER_PENDING: {ORDER_APPROVED, ORDER_CANCELLED},
    ORDER_APPROVED: {ORDER_IN_TRANSIT, ORDER_CANCELLED},
    ORDER_IN_TRANSIT: {ORDER_DELIVERED},
    ORDER_DELIVERED: set(),
    ORDER_CANCELLED: set(),
}

SHIPMENT_TRANSITIONS: dict[str, set[str]] = {
    SHIPMENT_CREATED: {SHIPMENT_ASSIGNED},
    SHIPMENT_ASSIGNED: {SHIPMENT_PICKED_UP},
    SHIPMENT_PICKED_UP: {SHIPMENT_IN_TRANSIT},
    SHIPMENT_IN_TRANSIT: {SHIPMENT_DELIVERED},
    SHIPMENT_DELIVERED: set(),
}

PAYMENT_TRANSITIONS: dict[str, set[str]] = {
    PAYMENT_PENDING: {PAYMENT_COMPLETED, PAYMENT_FAILED, PAYMENT_CANCELLED},
    PAYMENT_COMPLETED: set(),
    PAYMENT_FAILED: set(),
    PAYMENT_CANCELLED: set(),
}

RESOURCE_TRANSITIONS: dict[str, set[str]] = {
    RESOURCE_AVAILABLE: {RESOURCE_ASSIGNED},
    RESOURCE_ASSIGNED: {RESOURCE_IN_TRANSIT, RESOURCE_AVAILABLE},
    RESOURCE_IN_TRANSIT: {RESOURCE_AVAILABLE},
}

LEGACY_SHIPMENT_STATUS_ALIASES = {
    "Pending": SHIPMENT_CREATED,
}

LEGACY_TRACKING_STATUS_ALIASES = {
    "Pending": SHIPMENT_CREATED,
}


def normalize_status(status: str | None, aliases: Mapping[str, str] | None = None) -> str | None:
    if status is None:
        return None
    value = status.strip()
    if not value:
        return None
    if aliases:
        return aliases.get(value, value)
    return value


def normalize_order_status(status: str | None) -> str | None:
    return normalize_status(status)


def normalize_shipment_status(status: str | None) -> str | None:
    return normalize_status(status, LEGACY_SHIPMENT_STATUS_ALIASES)


def normalize_tracking_status(status: str | None) -> str | None:
    return normalize_status(status, LEGACY_TRACKING_STATUS_ALIASES)


def normalize_payment_status(status: str | None) -> str | None:
    return normalize_status(status)


def normalize_resource_status(status: str | None) -> str | None:
    return normalize_status(status)


def ensure_allowed_status(entity: str, next_status: str, allowed_statuses: set[str]) -> None:
    if next_status not in allowed_statuses:
        raise ValueError(f"Invalid {entity} status '{next_status}'.")


def can_transition(current_status: str | None, next_status: str, transitions: Mapping[str, set[str]]) -> bool:
    if current_status is None or current_status == next_status:
        return True
    return next_status in transitions.get(current_status, set())


def ensure_valid_transition(
    entity: str,
    current_status: str | None,
    next_status: str,
    transitions: Mapping[str, set[str]],
) -> None:
    if not can_transition(current_status, next_status, transitions):
        raise ValueError(f"Invalid {entity} transition from '{current_status}' to '{next_status}'.")


def map_tracking_to_order_status(tracking_status: str) -> str:
    if tracking_status in {SHIPMENT_CREATED, SHIPMENT_ASSIGNED, SHIPMENT_PICKED_UP}:
        return ORDER_APPROVED
    if tracking_status == SHIPMENT_IN_TRANSIT:
        return ORDER_IN_TRANSIT
    if tracking_status == SHIPMENT_DELIVERED:
        return ORDER_DELIVERED
    raise ValueError(f"No order status mapping for tracking status '{tracking_status}'.")


def map_shipment_to_resource_status(shipment_status: str) -> str | None:
    if shipment_status == SHIPMENT_ASSIGNED:
        return RESOURCE_ASSIGNED
    if shipment_status in {SHIPMENT_PICKED_UP, SHIPMENT_IN_TRANSIT}:
        return RESOURCE_IN_TRANSIT
    if shipment_status == SHIPMENT_DELIVERED:
        return RESOURCE_AVAILABLE
    return None
