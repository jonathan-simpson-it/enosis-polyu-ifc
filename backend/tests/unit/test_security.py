"""Test security module."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def test_hash_and_verify():
    from backend.src.core.security import hash_password, verify_password

    hashed = hash_password("test-password")
    assert hashed != "test-password"
    assert verify_password("test-password", hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_jwt_create_and_decode():
    from backend.src.core.security import create_access_token, decode_access_token

    token = create_access_token({"sub": "test-user-id"})
    assert token is not None
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "test-user-id"


def test_jwt_invalid_token():
    from backend.src.core.security import decode_access_token

    payload = decode_access_token("invalid-token")
    assert payload is None


def test_generate_api_key():
    from backend.src.core.security import generate_api_key

    key = generate_api_key()
    assert key.startswith("enosis_")
    assert len(key) > 20
