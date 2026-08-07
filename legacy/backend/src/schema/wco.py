"""WCO Data Model v3.11 declaration builder — JSON + XML."""

from __future__ import annotations

import uuid
from typing import Any

from backend.src.schema.registry import registry


def build_wco_json(
    declaration_data: dict[str, Any],
    commodities: list[dict[str, Any]],
) -> dict[str, Any]:
    declaration_id = declaration_data.get("declaration_number", str(uuid.uuid4())[:12].upper())

    def _build_consignment() -> dict[str, Any]:
        consignment: dict[str, Any] = {
            "Consignor": {
                "Name": declaration_data.get("consignor_name", ""),
                "Address": {"Line": declaration_data.get("consignor_address", "")},
            },
            "Consignee": {
                "Name": declaration_data.get("consignee_name", ""),
                "Address": {"Line": declaration_data.get("consignee_address", "")},
            },
            "LoadingLocation": {"Name": declaration_data.get("port_of_loading", "")},
            "DischargeLocation": {"Name": declaration_data.get("port_of_discharge", "")},
            "TransportEquipment": [
                {"ID": declaration_data.get("container_number", "N/A")}
            ],
            "ConsignmentPackageQuantity": declaration_data.get("number_of_packages", 1),
            "TransportModeCode": declaration_data.get("transport_mode", "Sea"),
        }

        if declaration_data.get("incoterms"):
            consignment["Incoterms"] = {"Code": declaration_data["incoterms"]}
        gross = declaration_data.get("gross_weight", 0)
        if gross:
            consignment["TotalGrossMassMeasure"] = {"Value": float(gross), "UnitCode": "KGM"}
        net = declaration_data.get("net_weight", 0)
        if net:
            consignment["TotalNetMassMeasure"] = {"Value": float(net), "UnitCode": "KGM"}

        return consignment

    def _build_goods_item(c: dict[str, Any], idx: int) -> dict[str, Any]:
        item: dict[str, Any] = {
            "SequenceNumeric": idx + 1,
            "Commodity": {
                "Classification": [
                    {"ID": c.get("hs_code", ""), "IdentificationTypeCode": "HS"}
                ],
                "Description": c.get("description", ""),
            },
            "GoodsMeasure": {},
        }

        if c.get("declared_value"):
            item["GoodsMeasure"]["CustomsValueAmount"] = {"Value": float(c["declared_value"])}
        if c.get("weight"):
            item["GoodsMeasure"]["NetNetWeightMeasure"] = {
                "Value": float(c["weight"]), "UnitCode": "KGM"
            }
        if c.get("quantity"):
            item["GoodsMeasure"]["QuantityQuantity"] = {"Value": float(c["quantity"])}
        if c.get("country_of_origin"):
            item["TradeCountry"] = [{"ID": c["country_of_origin"], "TypeCode": "Origin"}]

        return item

    return {
        "resourceType": "WCODeclaration",
        "type": "customs_declaration",
        "specification": "WCO Data Model v3.11",
        "profile": ["https://www.wcoomd.org/datamodel"],
        "declaration_id": declaration_id,
        "declaration": {
            "Declaration": {
                "ID": declaration_id,
                "FunctionCode": "9",
                "TypeCode": declaration_data.get("type_code", "IM"),
                "IssueDateTime": declaration_data.get("declaration_date", ""),
            },
            "GoodsShipment": {
                "Consignment": _build_consignment(),
                "GovernmentAgencyGoodsItem": [
                    _build_goods_item(c, i) for i, c in enumerate(commodities)
                ],
            },
        },
    }


def build_wco_xml(declaration_data: dict[str, Any], commodities: list[dict[str, Any]]) -> str:
    import xml.etree.ElementTree as ET

    json_data = build_wco_json(declaration_data, commodities)

    def dict_to_xml(parent: ET.Element, data: dict[str, Any]):
        for key, value in data.items():
            child = ET.SubElement(parent, key)
            if isinstance(value, dict):
                dict_to_xml(child, value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        dict_to_xml(child, item)
                    else:
                        elem = ET.SubElement(child, "Item")
                        elem.text = str(item)
            else:
                child.text = str(value) if value is not None else ""

    root = ET.Element("WCODeclaration")
    dict_to_xml(root, json_data)
    return ET.tostring(root, encoding="unicode", xml_declaration=True)


registry.register("wco_json", build_wco_json)
registry.register("wco_xml", build_wco_xml)
