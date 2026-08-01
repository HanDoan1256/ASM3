import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

# Modern password hashing uses bcrypt directly (passlib's CryptContext is avoided here
# due to a known incompatibility between passlib<=1.7.4 and bcrypt>=4.1, where passlib
# fails to detect the bcrypt backend version). Older accounts created before this change
# were stored as plain SHA-256 hex digests; verify_password() recognizes both formats so
# existing seeded/test accounts keep working, and upgrades the hash to bcrypt
# automatically after a successful legacy login (see needs_rehash/hash_password).
_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")
_LEGACY_SHA256_LENGTH = 64
_BCRYPT_MAX_BYTES = 72


def _is_legacy_sha256_hash(password_hash: str) -> bool:
    return len(password_hash) == _LEGACY_SHA256_LENGTH and all(
        c in "0123456789abcdef" for c in password_hash.lower()
    )


def _legacy_hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    """Hash a new/updated password using bcrypt."""
    password_bytes = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against either a bcrypt hash or a legacy SHA-256 hash."""
    if _is_legacy_sha256_hash(password_hash):
        return _legacy_hash_password(password) == password_hash
    if password_hash.startswith(_BCRYPT_PREFIXES):
        password_bytes = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
        try:
            return bcrypt.checkpw(password_bytes, password_hash.encode("utf-8"))
        except ValueError:
            return False
    return False


def needs_rehash(password_hash: str) -> bool:
    """True if the stored hash should be upgraded to the current bcrypt scheme."""
    return _is_legacy_sha256_hash(password_hash) or not password_hash.startswith(_BCRYPT_PREFIXES)


def create_access_token(subject: str, principal_type: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.jwt_expires_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "principal_type": principal_type,
        "role": role,
        "iat": now,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
