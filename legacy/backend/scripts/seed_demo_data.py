#!/usr/bin/env python3
"""Seed demo data: orgs, users, declarations, commodities, WCO, audit logs."""

import sys
import os
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.src.core.config import settings
from backend.src.core.database import Base
from backend.src.core.models.auth import Organization, User
from backend.src.core.models.trade import Declaration, Commodity
from backend.src.core.models.translation import WCODeclaration, AuditLog
from backend.src.core.security import hash_password

DEMO_PASSWORD_HASH = hash_password("demo1234")

ORG_GBA = uuid.UUID("11111111-1111-1111-1111-111111111111")
ORG_SZ = uuid.UUID("22222222-2222-2222-2222-222222222222")
ORG_POLYU = uuid.UUID("33333333-3333-3333-3333-333333333333")

USER_GBA_ADMIN = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
USER_GBA_OPS = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb")
USER_SZ_ADMIN = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa")
USER_SZ_EXPORT = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
USER_POLYU_RESEARCHER = uuid.UUID("cccccccc-cccc-cccc-cccc-aaaaaaaaaaaa")
USER_POLYU_INTERN = uuid.UUID("cccccccc-cccc-cccc-cccc-bbbbbbbbbbbb")

DEC_INVOICE = uuid.UUID("d1000000-0000-0000-0000-000000000001")
DEC_PACKING = uuid.UUID("d1000000-0000-0000-0000-000000000002")
DEC_WECHAT = uuid.UUID("d1000000-0000-0000-0000-000000000003")
DEC_COMMERCIAL = uuid.UUID("d1000000-0000-0000-0000-000000000004")
DEC_CN_MANIFEST = uuid.UUID("d1000000-0000-0000-0000-000000000005")
DEC_AIRWAY = uuid.UUID("d1000000-0000-0000-0000-000000000006")
DEC_CERT = uuid.UUID("d1000000-0000-0000-0000-000000000007")
DEC_EDGE = uuid.UUID("d1000000-0000-0000-0000-000000000008")

WCO_INVOICE = uuid.UUID("e2000000-0000-0000-0000-000000000001")
WCO_COMMERCIAL = uuid.UUID("e2000000-0000-0000-0000-000000000002")
WCO_AIRWAY = uuid.UUID("e2000000-0000-0000-0000-000000000003")

now = datetime.now(timezone.utc).replace(tzinfo=None)


def _tsw_ref(prefix: str) -> str:
    return f"TSW-DEMO-{prefix}-{uuid.uuid4().hex[:6].upper()}"


def seed():
    engine = create_engine(settings.database_url_sync)
    Base.metadata.create_all(bind=engine)
    db = Session(engine)

    # ── Organizations ──
    orgs_data = [
        {
            "id": ORG_GBA,
            "name": "GBA Logistics Ltd.",
            "br_number": "12345678",
            "subscription_tier": "premium",
            "usage_limit": 1000,
            "usage_current": 520,
        },
        {
            "id": ORG_SZ,
            "name": "Shenzhen Tech Exports Co.",
            "br_number": "87654321",
            "subscription_tier": "basic",
            "usage_limit": 100,
            "usage_current": 45,
        },
        {
            "id": ORG_POLYU,
            "name": "PolyU Trade Research Lab",
            "br_number": "11223344",
            "subscription_tier": "enterprise",
            "usage_limit": 10000,
            "usage_current": 218,
        },
    ]
    org_count = 0
    for o in orgs_data:
        if not db.query(Organization).filter(Organization.id == o["id"]).first():
            db.add(Organization(**o))
            org_count += 1

    # ── Users ──
    users_data = [
        {"id": USER_GBA_ADMIN, "org_id": ORG_GBA, "email": "alice@gbalogistics.hk", "full_name": "Alice Wong", "role": "admin"},
        {"id": USER_GBA_OPS, "org_id": ORG_GBA, "email": "david@gbalogistics.hk", "full_name": "David Cheung", "role": "member"},
        {"id": USER_SZ_ADMIN, "org_id": ORG_SZ, "email": "chen@sztrade.cn", "full_name": "Chen Weiqiang", "role": "admin"},
        {"id": USER_SZ_EXPORT, "org_id": ORG_SZ, "email": "liu@sztrade.cn", "full_name": "Liu Xiaoming", "role": "member"},
        {"id": USER_POLYU_RESEARCHER, "org_id": ORG_POLYU, "email": "prof.lee@polyu.edu.hk", "full_name": "Prof. Lee Ka-ming", "role": "admin"},
        {"id": USER_POLYU_INTERN, "org_id": ORG_POLYU, "email": "jessica.tan@polyu.edu.hk", "full_name": "Jessica Tan", "role": "member"},
    ]
    user_count = 0
    for u in users_data:
        if not db.query(User).filter(User.id == u["id"]).first():
            db.add(User(
                id=u["id"], org_id=u["org_id"], email=u["email"],
                full_name=u["full_name"], role=u["role"],
                hashed_password=DEMO_PASSWORD_HASH,
            ))
            user_count += 1

    if org_count or user_count:
        db.commit()

    # ── Declarations ──
    declarations_data = [
        # 1. Trade Invoice (GBA Logistics) — reviewed, ready to export
        {
            "id": DEC_INVOICE,
            "org_id": ORG_GBA,
            "user_id": USER_GBA_ADMIN,
            "filename": "invoice-sample.txt",
            "file_type": "txt",
            "file_size": 2480,
            "status": "reviewed",
            "confidence_avg": 0.91,
            "decl_number": "INV-2026-0715-0042",
            "consignor_name": "Shenzhen Electronics Trading Co., Ltd.",
            "consignor_address": "15 Huaqiang Bei Road, Futian District, Shenzhen, Guangdong, 518000",
            "consignee_name": "HK Digital Logistics Ltd.",
            "consignee_address": "22/F Enterprise Building, 118 Connaught Road West, Hong Kong",
            "port_of_loading": "Yantian, Shenzhen",
            "port_of_discharge": "Hong Kong",
            "incoterms": "CIF",
            "declared_currency": "USD",
            "total_declared_value": 639000.00,
            "gross_weight": 915.0,
            "net_weight": 832.0,
            "number_of_packages": 28,
            "container_number": "MSCU4820137",
            "country_of_origin": "China",
            "country_of_destination": "Hong Kong",
            "transport_mode": "Sea",
            "commercial_notes": "Vessel MSC GENEVA V.126W",
        },
        # 2. Packing List CSV (GBA Logistics) — extracted, needs review
        {
            "id": DEC_PACKING,
            "org_id": ORG_GBA,
            "user_id": USER_GBA_OPS,
            "filename": "packing-list.csv",
            "file_type": "csv",
            "file_size": 520,
            "status": "extracted",
            "confidence_avg": 0.88,
            "decl_number": "PKL-2026-0716",
            "consignor_name": "Dongguan Textile Export Co.",
            "consignor_address": "88 Houjie Avenue, Dongguan, Guangdong",
            "consignee_name": "HK Fashion Imports Ltd.",
            "consignee_address": "5/F, Garment Centre, 576 King's Road, North Point, Hong Kong",
            "port_of_loading": "Dongguan Humen",
            "port_of_discharge": "Hong Kong Kwai Chung",
            "incoterms": "FOB",
            "declared_currency": "USD",
            "total_declared_value": 415500.00,
            "gross_weight": 1180.0,
            "net_weight": 1050.0,
            "number_of_packages": 42,
            "container_number": "OOLU9172635",
            "country_of_origin": "China",
            "country_of_destination": "Hong Kong",
            "transport_mode": "Sea",
        },
        # 3. WeChat OCR (Shenzhen Tech) — processing
        {
            "id": DEC_WECHAT,
            "org_id": ORG_SZ,
            "user_id": USER_SZ_ADMIN,
            "filename": "wechat-scan.txt",
            "file_type": "txt",
            "file_size": 890,
            "status": "processing",
            "confidence_avg": 0.72,
            "decl_number": "WCH-2026-0714",
            "consignor_name": "Dongguan Huaqiang Electronics",
            "consignor_address": "Dongguan, Guangdong, China",
            "consignee_name": "HK Express Logistics",
            "consignee_address": "Hong Kong",
            "port_of_loading": "Dongguan",
            "port_of_discharge": "Hong Kong (Transshipment to Vietnam)",
            "incoterms": "CIF",
            "declared_currency": "USD",
            "total_declared_value": 85000.00,
            "gross_weight": 430.0,
            "net_weight": 380.0,
            "number_of_packages": 700,
            "container_number": "OOLU8125479",
            "country_of_origin": "China",
            "country_of_destination": "Vietnam",
            "transport_mode": "Sea",
        },
        # 4. HK-Europe Medical Devices (GBA Logistics) — reviewed
        {
            "id": DEC_COMMERCIAL,
            "org_id": ORG_GBA,
            "user_id": USER_GBA_ADMIN,
            "filename": "commercial-invoice.txt",
            "file_type": "txt",
            "file_size": 3100,
            "status": "reviewed",
            "confidence_avg": 0.94,
            "decl_number": "INV-2026-0720-0089",
            "consignor_name": "Asia Medical Devices (HK) Ltd.",
            "consignor_address": "Unit 1205, 12/F, Tower 6, The Gateway, 9 Canton Road, Tsim Sha Tsui, Kowloon, Hong Kong",
            "consignee_name": "EuroMed Healthcare GmbH",
            "consignee_address": "Kaiserstrasse 148, 60329 Frankfurt am Main, Germany",
            "port_of_loading": "Hong Kong International Terminals",
            "port_of_discharge": "Hamburg, Germany",
            "incoterms": "CIF",
            "declared_currency": "USD",
            "total_declared_value": 366000.00,
            "gross_weight": 1445.0,
            "net_weight": 1330.0,
            "number_of_packages": 45,
            "container_number": "HLBU2059183",
            "country_of_origin": "China",
            "country_of_destination": "Germany",
            "transport_mode": "Sea",
            "commercial_notes": "L/C: LC20260715-HKDE-0392 | EU MDR compliant",
        },
        # 5. Chinese Manifest (Shenzhen Tech) — extracted
        {
            "id": DEC_CN_MANIFEST,
            "org_id": ORG_SZ,
            "user_id": USER_SZ_EXPORT,
            "filename": "cn-manifest.txt",
            "file_type": "txt",
            "file_size": 1850,
            "status": "extracted",
            "confidence_avg": 0.81,
            "decl_number": "SZB-2026-0718",
            "consignor_name": "Shenzhen Smart Manufacturing Technology Co., Ltd.",
            "consignor_address": "5010 Baoan Avenue, Gushu Community, Xixiang Street, Baoan District, Shenzhen",
            "consignee_name": "HK Smart Logistics Ltd.",
            "consignee_address": "Flat B, 15/F, Yip Fung Building, 18 D'Aguilar Street, Central, Hong Kong",
            "port_of_loading": "Shenzhen Baoan Comprehensive Bonded Zone",
            "port_of_discharge": "Hong Kong Kwai Chung Terminal",
            "incoterms": "FOB",
            "declared_currency": "USD",
            "total_declared_value": 357400.00,
            "gross_weight": 2140.0,
            "net_weight": 2050.0,
            "number_of_packages": 85,
            "container_number": "COSU8192637",
            "country_of_origin": "China",
            "country_of_destination": "Hong Kong",
            "transport_mode": "Road",
            "commercial_notes": "Off-road truck via Shenzhen Bay Port. UN38.3 battery packaging.",
        },
        # 6. Air Waybill (PolyU Trade Lab) — reviewed, ready to export
        {
            "id": DEC_AIRWAY,
            "org_id": ORG_POLYU,
            "user_id": USER_POLYU_RESEARCHER,
            "filename": "air-waybill.txt",
            "file_type": "txt",
            "file_size": 2200,
            "status": "reviewed",
            "confidence_avg": 0.96,
            "decl_number": "160-1234-5678",
            "consignor_name": "Global Fashion Sourcing (HK) Ltd.",
            "consignor_address": "33/F, Lee Garden One, 33 Hysan Avenue, Causeway Bay, Hong Kong",
            "consignee_name": "FastFashion Retail GmbH",
            "consignee_address": "Mariahilfer Strasse 77, 1060 Vienna, Austria",
            "port_of_loading": "Hong Kong International (HKG)",
            "port_of_discharge": "London Heathrow (LHR)",
            "incoterms": "FCA",
            "declared_currency": "HKD",
            "total_declared_value": 1560000.00,
            "gross_weight": 680.0,
            "net_weight": 620.0,
            "number_of_packages": 24,
            "container_number": "",
            "country_of_origin": "China",
            "country_of_destination": "Austria",
            "transport_mode": "Air",
            "commercial_notes": "CX207 HKG-LHR, Express P1. Final dest: Vienna VIE.",
        },
        # 7. Certificate of Origin (Shenzhen Tech) — submitted
        {
            "id": DEC_CERT,
            "org_id": ORG_SZ,
            "user_id": USER_SZ_EXPORT,
            "filename": "cert-of-origin.txt",
            "file_type": "txt",
            "file_size": 2600,
            "status": "submitted",
            "confidence_avg": 0.98,
            "decl_number": "CEPA-HK-2026-08421",
            "consignor_name": "HK Precision Metals Ltd.",
            "consignor_address": "Units 8-10, 22/F, Technology Park, 18 Tat Hong Avenue, Tai Po, New Territories, Hong Kong",
            "consignee_name": "Shanghai Automotive Components Co., Ltd.",
            "consignee_address": "888 Zhangyang Road, Pudong New Area, Shanghai 200120, China",
            "port_of_loading": "Hong Kong",
            "port_of_discharge": "Shanghai Waigaoqiao",
            "incoterms": "FOB",
            "declared_currency": "HKD",
            "total_declared_value": 2560000.00,
            "gross_weight": 7500.0,
            "net_weight": 6850.0,
            "number_of_packages": 32,
            "container_number": "TCLU6091823",
            "country_of_origin": "Hong Kong",
            "country_of_destination": "China",
            "transport_mode": "Sea",
            "commercial_notes": "CEPA preferential tariff. COSCO SHIPPING STAR V.201W.",
        },
        # 8. Edge case — uploaded, just ingested
        {
            "id": DEC_EDGE,
            "org_id": ORG_POLYU,
            "user_id": USER_POLYU_INTERN,
            "filename": "borderless-table.pdf",
            "file_type": "pdf",
            "file_size": 14500,
            "status": "uploaded",
            "confidence_avg": 0.0,
            "decl_number": "BDR-2026-0719",
            "consignor_name": "",
            "consignor_address": "",
            "consignee_name": "",
            "consignee_address": "",
            "port_of_loading": "",
            "port_of_discharge": "",
            "incoterms": "",
            "declared_currency": "HKD",
            "total_declared_value": 0.0,
            "gross_weight": 0.0,
            "net_weight": 0.0,
            "number_of_packages": 0,
            "container_number": "",
            "country_of_origin": "",
            "country_of_destination": "",
            "transport_mode": "",
        },
    ]

    dec_count = 0
    for d in declarations_data:
        if not db.query(Declaration).filter(Declaration.id == d["id"]).first():
            db.add(Declaration(**d))
            dec_count += 1

    if dec_count:
        db.commit()

    # ── Commodities ──
    commodities_data = [
        # INV-2026-0715-0042: 3 items
        {"id": uuid.uuid4(), "declaration_id": DEC_INVOICE, "description": "Portable laptop computers, brand: Lenovo ThinkPad X1", "hs_code": "8471.30.00", "hs_code_confidence": 0.94, "quantity": 500, "unit": "units", "declared_value": 425000.00, "weight": 750.0, "country_of_origin": "CN", "reviewed": True, "reviewed_by": USER_GBA_ADMIN},
        {"id": uuid.uuid4(), "declaration_id": DEC_INVOICE, "description": "Solid-state storage drives, 1TB, NVMe", "hs_code": "8523.51.00", "hs_code_confidence": 0.92, "quantity": 1000, "unit": "units", "declared_value": 89000.00, "weight": 120.0, "country_of_origin": "CN", "reviewed": True, "reviewed_by": USER_GBA_ADMIN},
        {"id": uuid.uuid4(), "declaration_id": DEC_INVOICE, "description": "Electronic integrated circuits, processor controllers", "hs_code": "8542.31.00", "hs_code_confidence": 0.88, "quantity": 10000, "unit": "units", "declared_value": 125000.00, "weight": 45.0, "country_of_origin": "TW", "reviewed": True, "reviewed_by": USER_GBA_ADMIN},

        # Packing list: 5 items
        {"id": uuid.uuid4(), "declaration_id": DEC_PACKING, "description": "Cotton knitted pullovers", "hs_code": "6110.20.00", "hs_code_confidence": 0.90, "quantity": 2000, "unit": "pcs", "declared_value": 30000.00, "weight": 400.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_PACKING, "description": "Portable digital computers <=10kg", "hs_code": "8471.30.00", "hs_code_confidence": 0.93, "quantity": 150, "unit": "units", "declared_value": 138000.00, "weight": 225.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_PACKING, "description": "Electronic integrated circuits", "hs_code": "8542.31.00", "hs_code_confidence": 0.85, "quantity": 5000, "unit": "units", "declared_value": 42500.00, "weight": 25.0, "country_of_origin": "TW", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_PACKING, "description": "Medicaments in measured doses", "hs_code": "3004.90.00", "hs_code_confidence": 0.87, "quantity": 1000, "unit": "bottles", "declared_value": 45000.00, "weight": 180.0, "country_of_origin": "IN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_PACKING, "description": "Electrocardiographs", "hs_code": "9018.11.00", "hs_code_confidence": 0.91, "quantity": 50, "unit": "units", "declared_value": 160000.00, "weight": 350.0, "country_of_origin": "DE", "reviewed": False, "reviewed_by": None},

        # WeChat: 2 items (processing, low confidence)
        {"id": uuid.uuid4(), "declaration_id": DEC_WECHAT, "description": "Electronic components", "hs_code": "8542.31.00", "hs_code_confidence": 0.68, "quantity": 500, "unit": "cartons", "declared_value": 55000.00, "weight": 250.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_WECHAT, "description": "LED display screens", "hs_code": "8528.72.00", "hs_code_confidence": 0.55, "quantity": 200, "unit": "cartons", "declared_value": 30000.00, "weight": 180.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},

        # HK-Europe Medical Devices: 5 items
        {"id": uuid.uuid4(), "declaration_id": DEC_COMMERCIAL, "description": "Electrocardiographs, 12-channel, GE MAC 2000", "hs_code": "9018.11.00", "hs_code_confidence": 0.97, "quantity": 30, "unit": "units", "declared_value": 96000.00, "weight": 270.0, "country_of_origin": "US", "reviewed": True, "reviewed_by": USER_GBA_ADMIN},
        {"id": uuid.uuid4(), "declaration_id": DEC_COMMERCIAL, "description": "Diagnostic laboratory reagents, COVID/Flu combo test kits", "hs_code": "3822.00.00", "hs_code_confidence": 0.94, "quantity": 50000, "unit": "kits", "declared_value": 120000.00, "weight": 380.0, "country_of_origin": "CN", "reviewed": True, "reviewed_by": USER_GBA_ADMIN},
        {"id": uuid.uuid4(), "declaration_id": DEC_COMMERCIAL, "description": "Orthopaedic fracture appliances, titanium bone plates", "hs_code": "9021.10.00", "hs_code_confidence": 0.89, "quantity": 2000, "unit": "pcs", "declared_value": 90000.00, "weight": 180.0, "country_of_origin": "DE", "reviewed": True, "reviewed_by": USER_GBA_ADMIN},
        {"id": uuid.uuid4(), "declaration_id": DEC_COMMERCIAL, "description": "Syringes with needles, 3ml, sterile, single-use", "hs_code": "9018.39.00", "hs_code_confidence": 0.95, "quantity": 100000, "unit": "units", "declared_value": 18000.00, "weight": 420.0, "country_of_origin": "CN", "reviewed": True, "reviewed_by": USER_GBA_ADMIN},
        {"id": uuid.uuid4(), "declaration_id": DEC_COMMERCIAL, "description": "Portable digital blood pressure monitors, Bluetooth-enabled", "hs_code": "9018.90.00", "hs_code_confidence": 0.91, "quantity": 1500, "unit": "units", "declared_value": 42000.00, "weight": 195.0, "country_of_origin": "CN", "reviewed": True, "reviewed_by": USER_GBA_ADMIN},

        # Chinese Manifest: 6 items
        {"id": uuid.uuid4(), "declaration_id": DEC_CN_MANIFEST, "description": "Lithium-ion battery packs 48V 20Ah", "hs_code": "8507.60.00", "hs_code_confidence": 0.82, "quantity": 800, "unit": "units", "declared_value": 96000.00, "weight": 1200.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_CN_MANIFEST, "description": "Brushless DC motors 1000W", "hs_code": "8501.40.00", "hs_code_confidence": 0.78, "quantity": 350, "unit": "units", "declared_value": 157500.00, "weight": 560.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_CN_MANIFEST, "description": "Carbon fiber propellers 15 inch", "hs_code": "8803.90.00", "hs_code_confidence": 0.85, "quantity": 3000, "unit": "pcs", "declared_value": 25500.00, "weight": 60.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_CN_MANIFEST, "description": "Printed circuit boards, multilayer PCB", "hs_code": "8534.00.00", "hs_code_confidence": 0.80, "quantity": 12000, "unit": "pcs", "declared_value": 38400.00, "weight": 180.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_CN_MANIFEST, "description": "Lithium polymer batteries 3.7V 5000mAh", "hs_code": "8507.60.00", "hs_code_confidence": 0.83, "quantity": 5000, "unit": "pcs", "declared_value": 29000.00, "weight": 95.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},
        {"id": uuid.uuid4(), "declaration_id": DEC_CN_MANIFEST, "description": "Drone parts — motor mounts", "hs_code": "8803.90.00", "hs_code_confidence": 0.76, "quantity": 500, "unit": "pcs", "declared_value": 11000.00, "weight": 45.0, "country_of_origin": "CN", "reviewed": False, "reviewed_by": None},

        # Air Waybill: 4 items
        {"id": uuid.uuid4(), "declaration_id": DEC_AIRWAY, "description": "Womens dresses, synthetic fibres, summer collection", "hs_code": "6204.43.00", "hs_code_confidence": 0.96, "quantity": 800, "unit": "pcs", "declared_value": 360000.00, "weight": 180.0, "country_of_origin": "CN", "reviewed": True, "reviewed_by": USER_POLYU_RESEARCHER},
        {"id": uuid.uuid4(), "declaration_id": DEC_AIRWAY, "description": "Womens trousers, cotton, casual line", "hs_code": "6204.62.00", "hs_code_confidence": 0.95, "quantity": 1200, "unit": "pcs", "declared_value": 384000.00, "weight": 200.0, "country_of_origin": "CN", "reviewed": True, "reviewed_by": USER_POLYU_RESEARCHER},
        {"id": uuid.uuid4(), "declaration_id": DEC_AIRWAY, "description": "Mens T-shirts, cotton, premium basics", "hs_code": "6109.10.00", "hs_code_confidence": 0.97, "quantity": 2000, "unit": "pcs", "declared_value": 360000.00, "weight": 150.0, "country_of_origin": "BD", "reviewed": True, "reviewed_by": USER_POLYU_RESEARCHER},
        {"id": uuid.uuid4(), "declaration_id": DEC_AIRWAY, "description": "Ladies leather handbags, calfskin", "hs_code": "4202.22.00", "hs_code_confidence": 0.93, "quantity": 300, "unit": "pcs", "declared_value": 456000.00, "weight": 150.0, "country_of_origin": "IT", "reviewed": True, "reviewed_by": USER_POLYU_RESEARCHER},

        # Certificate of Origin: 3 items
        {"id": uuid.uuid4(), "declaration_id": DEC_CERT, "description": "Aluminium alloy profiles, precision-milled, for automotive window frames", "hs_code": "7604.29.90", "hs_code_confidence": 0.99, "quantity": 15000, "unit": "metres", "declared_value": 1260000.00, "weight": 4200.0, "country_of_origin": "HK", "reviewed": True, "reviewed_by": USER_SZ_EXPORT},
        {"id": uuid.uuid4(), "declaration_id": DEC_CERT, "description": "Stamped iron brackets for vehicle brake system mounting", "hs_code": "8708.30.00", "hs_code_confidence": 0.98, "quantity": 40000, "unit": "pcs", "declared_value": 960000.00, "weight": 1800.0, "country_of_origin": "HK", "reviewed": True, "reviewed_by": USER_SZ_EXPORT},
        {"id": uuid.uuid4(), "declaration_id": DEC_CERT, "description": "Steel screws and bolts, M8-M12, automotive grade", "hs_code": "7318.15.00", "hs_code_confidence": 0.97, "quantity": 200000, "unit": "pcs", "declared_value": 340000.00, "weight": 850.0, "country_of_origin": "HK", "reviewed": True, "reviewed_by": USER_SZ_EXPORT},
    ]

    comm_count = 0
    for c in commodities_data:
        existing = db.query(Commodity).filter(
            Commodity.declaration_id == c["declaration_id"],
            Commodity.description == c["description"],
        ).first()
        if not existing:
            db.add(Commodity(**c))
            comm_count += 1

    if comm_count:
        db.commit()

    # ── WCO Declarations ──
    wco_data = [
        {
            "id": WCO_INVOICE,
            "declaration_id": DEC_INVOICE,
            "wco_json": {
                "declaration": {
                    "declaration_number": str(DEC_INVOICE),
                    "declaration_type": "EXPORT",
                    "declarant_reference": "INV-2026-0715-0042",
                    "consignor": {"name": "Shenzhen Electronics Trading Co., Ltd."},
                    "consignee": {"name": "HK Digital Logistics Ltd."},
                    "transport": {
                        "mode": "Sea",
                        "container_number": "MSCU4820137",
                        "port_of_loading": "Yantian, Shenzhen",
                        "port_of_discharge": "Hong Kong",
                    },
                    "total_gross_weight": {"value": 915.0, "unit": "kg"},
                    "total_net_weight": {"value": 832.0, "unit": "kg"},
                    "total_declared_value": {"value": 639000.00, "currency": "USD"},
                    "incoterms": "CIF",
                    "number_of_packages": 28,
                    "items": [
                        {"item_number": 1, "description": "Portable laptop computers, brand: Lenovo ThinkPad X1", "hs_code": "8471.30.00", "quantity": 500, "unit": "units", "declared_value": 425000.00, "weight": 750.0, "country_of_origin": "CN"},
                        {"item_number": 2, "description": "Solid-state storage drives, 1TB, NVMe", "hs_code": "8523.51.00", "quantity": 1000, "unit": "units", "declared_value": 89000.00, "weight": 120.0, "country_of_origin": "CN"},
                        {"item_number": 3, "description": "Electronic integrated circuits, processor controllers", "hs_code": "8542.31.00", "quantity": 10000, "unit": "units", "declared_value": 125000.00, "weight": 45.0, "country_of_origin": "TW"},
                    ],
                }
            },
            "validation_status": "valid",
            "tsw_reference": _tsw_ref("INV"),
        },
        {
            "id": WCO_COMMERCIAL,
            "declaration_id": DEC_COMMERCIAL,
            "wco_json": {
                "declaration": {
                    "declaration_number": str(DEC_COMMERCIAL),
                    "declaration_type": "EXPORT",
                    "declarant_reference": "INV-2026-0720-0089",
                    "consignor": {"name": "Asia Medical Devices (HK) Ltd."},
                    "consignee": {"name": "EuroMed Healthcare GmbH"},
                    "transport": {
                        "mode": "Sea",
                        "container_number": "HLBU2059183",
                        "port_of_loading": "Hong Kong International Terminals",
                        "port_of_discharge": "Hamburg, Germany",
                    },
                    "total_gross_weight": {"value": 1445.0, "unit": "kg"},
                    "total_net_weight": {"value": 1330.0, "unit": "kg"},
                    "total_declared_value": {"value": 366000.00, "currency": "USD"},
                    "incoterms": "CIF",
                    "number_of_packages": 45,
                    "items": [
                        {"item_number": 1, "description": "Electrocardiographs, 12-channel, GE MAC 2000", "hs_code": "9018.11.00", "quantity": 30, "unit": "units", "declared_value": 96000.00, "weight": 270.0, "country_of_origin": "US"},
                        {"item_number": 2, "description": "Diagnostic laboratory reagents, COVID/Flu combo test kits", "hs_code": "3822.00.00", "quantity": 50000, "unit": "kits", "declared_value": 120000.00, "weight": 380.0, "country_of_origin": "CN"},
                        {"item_number": 3, "description": "Orthopaedic fracture appliances, titanium bone plates", "hs_code": "9021.10.00", "quantity": 2000, "unit": "pcs", "declared_value": 90000.00, "weight": 180.0, "country_of_origin": "DE"},
                        {"item_number": 4, "description": "Syringes with needles, 3ml, sterile, single-use", "hs_code": "9018.39.00", "quantity": 100000, "unit": "units", "declared_value": 18000.00, "weight": 420.0, "country_of_origin": "CN"},
                        {"item_number": 5, "description": "Portable digital blood pressure monitors, Bluetooth-enabled", "hs_code": "9018.90.00", "quantity": 1500, "unit": "units", "declared_value": 42000.00, "weight": 195.0, "country_of_origin": "CN"},
                    ],
                }
            },
            "validation_status": "valid",
            "tsw_reference": _tsw_ref("MED"),
        },
        {
            "id": WCO_AIRWAY,
            "declaration_id": DEC_AIRWAY,
            "wco_json": {
                "declaration": {
                    "declaration_number": str(DEC_AIRWAY),
                    "declaration_type": "EXPORT",
                    "declarant_reference": "160-1234-5678",
                    "consignor": {"name": "Global Fashion Sourcing (HK) Ltd."},
                    "consignee": {"name": "FastFashion Retail GmbH"},
                    "transport": {
                        "mode": "Air",
                        "container_number": "",
                        "port_of_loading": "Hong Kong International (HKG)",
                        "port_of_discharge": "London Heathrow (LHR)",
                    },
                    "total_gross_weight": {"value": 680.0, "unit": "kg"},
                    "total_net_weight": {"value": 620.0, "unit": "kg"},
                    "total_declared_value": {"value": 1560000.00, "currency": "HKD"},
                    "incoterms": "FCA",
                    "number_of_packages": 24,
                    "items": [
                        {"item_number": 1, "description": "Womens dresses, synthetic fibres, summer collection", "hs_code": "6204.43.00", "quantity": 800, "unit": "pcs", "declared_value": 360000.00, "weight": 180.0, "country_of_origin": "CN"},
                        {"item_number": 2, "description": "Womens trousers, cotton, casual line", "hs_code": "6204.62.00", "quantity": 1200, "unit": "pcs", "declared_value": 384000.00, "weight": 200.0, "country_of_origin": "CN"},
                        {"item_number": 3, "description": "Mens T-shirts, cotton, premium basics", "hs_code": "6109.10.00", "quantity": 2000, "unit": "pcs", "declared_value": 360000.00, "weight": 150.0, "country_of_origin": "BD"},
                        {"item_number": 4, "description": "Ladies leather handbags, calfskin", "hs_code": "4202.22.00", "quantity": 300, "unit": "pcs", "declared_value": 456000.00, "weight": 150.0, "country_of_origin": "IT"},
                    ],
                }
            },
            "validation_status": "valid",
            "tsw_reference": _tsw_ref("AWB"),
        },
    ]

    wco_count = 0
    for w in wco_data:
        if not db.query(WCODeclaration).filter(WCODeclaration.id == w["id"]).first():
            db.add(WCODeclaration(**w))
            wco_count += 1

    if wco_count:
        db.commit()

    # ── Audit Logs ──
    base_time = now - timedelta(days=7)

    def _add_log(org_id, user_id, action, resource_type, resource_id, offset_hours=0, details=None):
        return AuditLog(
            id=uuid.uuid4(),
            org_id=org_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            details=details,
            created_at=base_time + timedelta(hours=offset_hours),
        )

    audit_entries = [
        # Invoice lifecycle (ORG_GBA)
        _add_log(ORG_GBA, USER_GBA_ADMIN, "document.uploaded", "declaration", DEC_INVOICE, 0),
        _add_log(ORG_GBA, None, "document.processing", "declaration", DEC_INVOICE, 1, {"engine": "ner-pipeline-v2"}),
        _add_log(ORG_GBA, None, "document.extracted", "declaration", DEC_INVOICE, 2, {"confidence": 0.91, "hs_codes_found": 3}),
        _add_log(ORG_GBA, USER_GBA_ADMIN, "document.reviewed", "declaration", DEC_INVOICE, 4, {"commodities_reviewed": 3}),
        _add_log(ORG_GBA, USER_GBA_ADMIN, "export.generated", "declaration", DEC_INVOICE, 6, {"format": "wco_json"}),
        _add_log(ORG_GBA, USER_GBA_OPS, "document.viewed", "declaration", DEC_INVOICE, 8),

        # Packing list lifecycle
        _add_log(ORG_GBA, USER_GBA_OPS, "document.uploaded", "declaration", DEC_PACKING, 12),
        _add_log(ORG_GBA, None, "document.processing", "declaration", DEC_PACKING, 13, {"engine": "csv-parser"}),
        _add_log(ORG_GBA, None, "document.extracted", "declaration", DEC_PACKING, 14, {"confidence": 0.88, "hs_codes_found": 5}),
        _add_log(ORG_GBA, USER_GBA_OPS, "document.viewed", "declaration", DEC_PACKING, 15),

        # WeChat OCR lifecycle (ORG_SZ)
        _add_log(ORG_SZ, USER_SZ_ADMIN, "document.uploaded", "declaration", DEC_WECHAT, 16),
        _add_log(ORG_SZ, None, "document.processing", "declaration", DEC_WECHAT, 17, {"engine": "ocr-pipeline", "ocr_confidence": 0.78, "language": "zh-CN"}),

        # Medical devices HK-Europe lifecycle (ORG_GBA)
        _add_log(ORG_GBA, USER_GBA_ADMIN, "document.uploaded", "declaration", DEC_COMMERCIAL, 20),
        _add_log(ORG_GBA, None, "document.processing", "declaration", DEC_COMMERCIAL, 21, {"engine": "ner-pipeline-v2"}),
        _add_log(ORG_GBA, None, "document.extracted", "declaration", DEC_COMMERCIAL, 22, {"confidence": 0.94, "hs_codes_found": 5}),
        _add_log(ORG_GBA, USER_GBA_ADMIN, "document.reviewed", "declaration", DEC_COMMERCIAL, 24, {"commodities_reviewed": 5}),
        _add_log(ORG_GBA, USER_GBA_ADMIN, "export.generated", "declaration", DEC_COMMERCIAL, 26, {"format": "wco_json"}),

        # Chinese manifest lifecycle (ORG_SZ)
        _add_log(ORG_SZ, USER_SZ_EXPORT, "document.uploaded", "declaration", DEC_CN_MANIFEST, 28),
        _add_log(ORG_SZ, None, "document.processing", "declaration", DEC_CN_MANIFEST, 29, {"engine": "ner-pipeline-v2", "language": "zh-CN"}),
        _add_log(ORG_SZ, None, "document.extracted", "declaration", DEC_CN_MANIFEST, 30, {"confidence": 0.81, "hs_codes_found": 6}),

        # Air Waybill lifecycle (ORG_POLYU)
        _add_log(ORG_POLYU, USER_POLYU_RESEARCHER, "document.uploaded", "declaration", DEC_AIRWAY, 32),
        _add_log(ORG_POLYU, None, "document.processing", "declaration", DEC_AIRWAY, 33, {"engine": "ner-pipeline-v2"}),
        _add_log(ORG_POLYU, None, "document.extracted", "declaration", DEC_AIRWAY, 34, {"confidence": 0.96, "hs_codes_found": 4}),
        _add_log(ORG_POLYU, USER_POLYU_RESEARCHER, "document.reviewed", "declaration", DEC_AIRWAY, 36, {"commodities_reviewed": 4}),
        _add_log(ORG_POLYU, USER_POLYU_RESEARCHER, "export.generated", "declaration", DEC_AIRWAY, 38, {"format": "wco_json"}),

        # CEPA Certificate lifecycle (ORG_SZ) — full cycle to submitted
        _add_log(ORG_SZ, USER_SZ_EXPORT, "document.uploaded", "declaration", DEC_CERT, 40),
        _add_log(ORG_SZ, None, "document.processing", "declaration", DEC_CERT, 41, {"engine": "ner-pipeline-v2"}),
        _add_log(ORG_SZ, None, "document.extracted", "declaration", DEC_CERT, 42, {"confidence": 0.98, "hs_codes_found": 3}),
        _add_log(ORG_SZ, USER_SZ_EXPORT, "document.reviewed", "declaration", DEC_CERT, 44, {"commodities_reviewed": 3}),
        _add_log(ORG_SZ, USER_SZ_EXPORT, "export.generated", "declaration", DEC_CERT, 46, {"format": "wco_json"}),
        _add_log(ORG_SZ, USER_SZ_EXPORT, "export.submitted", "declaration", DEC_CERT, 48, {"tsw_reference": _tsw_ref("CEPA"), "system": "mock-tsw"}),
        _add_log(ORG_SZ, None, "tsw.acknowledged", "declaration", DEC_CERT, 50, {"status": "accepted", "response_time_ms": 342}),

        # Edge case — borderless table upload
        _add_log(ORG_POLYU, USER_POLYU_INTERN, "document.uploaded", "declaration", DEC_EDGE, 52),
        _add_log(ORG_POLYU, None, "document.processing", "declaration", DEC_EDGE, 53, {"engine": "pdf-ocr-pipeline"}),
        _add_log(ORG_POLYU, None, "document.processing_failed", "declaration", DEC_EDGE, 54, {"error": "low_confidence_extraction", "reason": "No structured table detected", "recommendation": "Manual review required"}),

        # Org-level actions
        _add_log(ORG_GBA, USER_GBA_ADMIN, "org.settings_updated", "organization", ORG_GBA, 0, {"subscription_tier": "premium"}),
        _add_log(ORG_SZ, USER_SZ_ADMIN, "org.settings_updated", "organization", ORG_SZ, 16, {"usage_limit_increased": 100}),
        _add_log(ORG_POLYU, USER_POLYU_RESEARCHER, "api_key.regenerated", "user", USER_POLYU_RESEARCHER, 32),
    ]

    audit_count = 0
    for a in audit_entries:
        db.add(a)
        audit_count += 1

    db.commit()
    db.close()

    print(f"Demo data seeded: {org_count} orgs, {user_count} users, {dec_count} declarations, {comm_count} commodities, {wco_count} WCO declarations, {audit_count} audit logs")
    print(f"All demo users share password: demo1234")


if __name__ == "__main__":
    seed()
