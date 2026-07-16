"""WCO Data Model declaration construction service."""

from __future__ import annotations

import uuid
from typing import Any


def generate_id() -> str:
    return str(uuid.uuid4())


def create_wco_header(declaration_data: dict[str, Any]) -> dict[str, Any]:
    header = {
        "ID": generate_id(),
        "FunctionCode": "9",
        "TypeCode": "IM",
        "IssueDateTime": declaration_data.get("declaration_date", ""),
    }
    if declaration_data.get("declaration_number"):
        header["ID"] = declaration_data["declaration_number"]
    return header


def create_wco_consignment(declaration_data: dict[str, Any]) -> dict[str, Any]:
    consignment: dict[str, Any] = {
        "Consignor": {
            "Name": declaration_data.get("consignor_name", ""),
            "Address": {
                "Line": declaration_data.get("consignor_address", ""),
            },
        },
        "Consignee": {
            "Name": declaration_data.get("consignee_name", ""),
            "Address": {
                "Line": declaration_data.get("consignee_address", ""),
            },
        },
        "LoadingLocation": {
            "Name": declaration_data.get("port_of_loading", ""),
        },
        "DischargeLocation": {
            "Name": declaration_data.get("port_of_discharge", ""),
        },
        "TransportEquipment": [
            {
                "ID": declaration_data.get("container_number", "N/A"),
            }
        ],
        "ConsignmentPackageQuantity": declaration_data.get("number_of_packages", 1),
    }

    if declaration_data.get("transport_mode"):
        consignment["TransportModeCode"] = declaration_data["transport_mode"]

    if declaration_data.get("incoterms"):
        consignment["Incoterms"] = {
            "Code": declaration_data["incoterms"],
        }

    gross = declaration_data.get("gross_weight", 0)
    net = declaration_data.get("net_weight", 0)
    if gross:
        consignment["TotalGrossMassMeasure"] = {"Value": gross, "UnitCode": "KGM"}
    if net:
        consignment["TotalNetMassMeasure"] = {"Value": net, "UnitCode": "KGM"}

    return consignment


def create_wco_goods_item(
    commodity: dict[str, Any],
    index: int,
) -> dict[str, Any]:
    hs_code = commodity.get("hs_code", commodity.get("mapped_code", ""))
    description = commodity.get("description", commodity.get("original_description", ""))
    value = commodity.get("declared_value", 0)
    weight = commodity.get("weight", 0)
    quantity = commodity.get("quantity", 1)
    country = commodity.get("country_of_origin", "")

    item: dict[str, Any] = {
        "GovernmentAgencyGoodsItem": {
            "SequenceNumeric": index + 1,
            "Commodity": {
                "Classification": [
                    {
                        "ID": hs_code,
                        "IdentificationTypeCode": "HS",
                    }
                ],
                "Description": description,
            },
            "GoodsMeasure": {},
        }
    }

    if value:
        item["GovernmentAgencyGoodsItem"]["GoodsMeasure"]["CustomsValueAmount"] = {
            "Value": value,
        }

    if weight:
        item["GovernmentAgencyGoodsItem"]["GoodsMeasure"]["NetNetWeightMeasure"] = {
            "Value": weight,
            "UnitCode": "KGM",
        }

    if quantity:
        item["GovernmentAgencyGoodsItem"]["GoodsMeasure"]["QuantityQuantity"] = {
            "Value": quantity,
        }

    if country:
        item["GovernmentAgencyGoodsItem"]["TradeCountry"] = [
            {"ID": country, "TypeCode": "Origin"}
        ]

    return item


def create_wco_declaration(
    declaration_data: dict[str, Any],
    commodities: list[dict[str, Any]],
) -> dict[str, Any]:
    goods_items = []
    for i, commodity in enumerate(commodities):
        goods_items.append(create_wco_goods_item(commodity, i))

    declaration: dict[str, Any] = {
        "Declaration": {
            "FunctionCode": "9",
            "TypeCode": "IM",
            "FunctionType": "Import Declaration",
        },
        "GoodsShipment": {
            "Consignment": create_wco_consignment(declaration_data),
            "GovernmentAgencyGoodsItem": [gi["GovernmentAgencyGoodsItem"] for gi in goods_items],
        },
    }

    header = create_wco_header(declaration_data)
    declaration["Declaration"].update(header)

    return {
        "resourceType": "WCODeclaration",
        "type": "customs_declaration",
        "specification": "WCO Data Model v3.11",
        "profile": ["https://www.wcoomd.org/datamodel"],
        "declaration_id": generate_id(),
        "declaration": declaration,
    }
