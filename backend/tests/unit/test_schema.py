"""Test schema mapping and validation."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def test_build_wco_json():
    from backend.src.schema.wco import build_wco_json

    decl_data = {
        "declaration_number": "DEC-TEST-001",
        "consignor_name": "Test Trader Ltd",
        "consignee_name": "Test Buyer Ltd",
        "port_of_loading": "Yantian",
        "port_of_discharge": "Hong Kong",
        "incoterms": "CIF",
        "container_number": "TEST1234567",
        "gross_weight": 5000.0,
        "net_weight": 4800.0,
    }

    commodities = [
        {
            "description": "Test integrated circuits",
            "hs_code": "8542.31.00",
            "declared_value": 50000.0,
            "weight": 100.0,
            "quantity": 1000,
            "country_of_origin": "CN",
        }
    ]

    result = build_wco_json(decl_data, commodities)
    assert result["resourceType"] == "WCODeclaration"
    assert result["specification"] == "WCO Data Model v3.11"

    goods = result["declaration"]["GoodsShipment"]["GovernmentAgencyGoodsItem"]
    assert len(goods) == 1
    assert goods[0]["Commodity"]["Classification"][0]["ID"] == "8542.31.00"
    assert goods[0]["GoodsMeasure"]["CustomsValueAmount"]["Value"] == 50000.0


def test_registry():
    from backend.src.schema.registry import registry
    import backend.src.schema.tsw  # noqa: F401 — triggers registry.register

    formats = registry.list()
    assert "wco_json" in formats
    assert "wco_xml" in formats
    assert "tsw_json" in formats


def test_validate_hs_code():
    from backend.src.schema.validator import validate_hs_code

    assert validate_hs_code("8542.31.00") is True
    assert validate_hs_code("7604.29.90") is True
    assert validate_hs_code("invalid") is False
    assert validate_hs_code("1234") is False


def test_validate_commodity():
    from backend.src.schema.validator import validate_commodity

    result = validate_commodity({"hs_code": "8542.31.00", "declared_value": 50000, "weight": 100})
    assert result["valid"] is True

    result = validate_commodity({"hs_code": "invalid"})
    assert result["valid"] is False


def test_business_rules():
    from backend.src.schema.rules import (
        check_incoterms_rules,
        check_required_fields,
        check_weight_consistency,
    )

    result = check_incoterms_rules("CIF", "Yantian", "Hong Kong")
    assert result["valid"] is True

    result = check_incoterms_rules("INVALID", "", "")
    assert result["valid"] is False

    result = check_required_fields({"consignor_name": "A", "consignee_name": "B", "port_of_loading": "C", "port_of_discharge": "D"})
    assert result["valid"] is True

    result = check_required_fields({"consignor_name": "A"})
    assert result["valid"] is False

    result = check_weight_consistency(
        [{"weight": 100}, {"weight": 200}],
        declared_gross=350,
    )
    assert result["valid"] is True


def test_build_tsw_payload():
    from backend.src.schema.tsw import build_tsw_payload

    result = build_tsw_payload(
        {"declaration_number": "DEC-001", "consignor_name": "Test"},
        [{"description": "Item 1", "hs_code": "8542.31.00"}],
    )
    assert result["tsw_version"] == "3.0"
    assert result["submission_type"] == "declaration"
    assert "declaration" in result
