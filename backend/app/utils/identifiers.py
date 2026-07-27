from uuid import uuid4


def build_identifier(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:8].upper()}"

