"""Test configuration loading."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def test_settings_load():
    from backend.src.core.config import settings

    assert settings.app_name == "Enosis UDIE"
    assert settings.app_version == "v0-production-mvp"
    assert settings.jwt_algorithm == "HS256"


def test_settings_from_env():
    os.environ["ENOSIS_TEST"] = "true"
    from backend.src.core.config import settings

    assert settings.debug is False
    assert settings.jwt_algorithm == "HS256"
