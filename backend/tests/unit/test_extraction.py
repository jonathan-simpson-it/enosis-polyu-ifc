"""Test extraction pipeline (NER, confidence, translator)."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def test_ner_extract_entities():
    from backend.src.extraction.ner import extract_entities

    text = """
    INVOICE: INV-2026-001
    Container: MSCU4820347
    Item 1: Electronic integrated circuits 7400 series
    HS Code: 8542.31.00
    Weight: 120 KG
    Value: HKD 450,000
    Quantity: 5000 PCS
    Origin: CN
    Date: 2026-07-15
    """

    entities = extract_entities(text)
    assert "8542.31.00" in entities["hs_codes"]
    assert "MSCU4820347" in entities["container_numbers"]
    assert entities["weights"]
    assert entities["values"]
    assert entities["dates"]
    assert "CN" in entities["countries"]


def test_confidence_scoring():
    from backend.src.extraction.confidence import (
        score_hs_code_confidence,
        score_extraction_confidence,
        needs_human_review,
    )

    entities = {
        "hs_codes": ["8542.31.00"],
        "container_numbers": ["MSCU4820347"],
        "weights": ["120"],
        "values": ["450000"],
        "quantities": ["5000"],
        "dates": ["2026-07-15"],
        "countries": ["CN"],
        "commodity_descriptions": ["Integrated circuits"],
    }

    scores = score_extraction_confidence(entities, "Test text with enough content " * 10)
    assert scores["hs_codes"] > 0
    assert scores["overall"] >= 0.80

    empty_scores = score_extraction_confidence({"hs_codes": [], "container_numbers": [], "weights": [], "dates": []}, "short")
    assert empty_scores["overall"] < 0.80

    assert needs_human_review(0.70, threshold=0.85) is True
    assert needs_human_review(0.95, threshold=0.85) is False

    confidence = score_hs_code_confidence("8542.31.00", "Integrated circuits", vector_distance=0.1)
    assert 0.80 <= confidence <= 0.99


def test_deepseek_translator_imports():
    from backend.src.extraction.translator import DeepSeekTranslator, SYSTEM_PROMPT

    assert "HS Codes" in SYSTEM_PROMPT
    assert "WCO Data Model" in SYSTEM_PROMPT

    translator = DeepSeekTranslator(api_key="")
    assert translator.model == "deepseek-v4-flash"
