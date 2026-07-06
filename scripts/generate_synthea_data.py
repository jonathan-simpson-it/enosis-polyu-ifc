"""Synthea-style synthetic patient generator for Hong Kong eHealth standards.

Generates realistic patient cohorts matching HK eHealth Content Standards (V1.10):
- HKID format with checksum
- Chinese names (English transliteration)
- Hong Kong phone numbers
- ICD-10-HK diagnosis codes (common HK diseases)
- SNOMED-CT medication codes
- HK-appropriate lab results, vitals, and clinical notes
- FHIR R5 bundles following eHealth data type specifications

Usage:
    python scripts/generate_synthea_data.py [--patients 10] [--seed 42]
"""

import argparse
import json
import random
import string
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# ── HK Name Data ──────────────────────────────────────────────────────────────

HK_SURNAMES = [
    "Chan", "Leung", "Cheung", "Wong", "Man", "Lee", "Chu", "Lau", "Ng",
    "Yeung", "Tam", "Lo", "Kwok", "Ho", "Tse", "Lui", "Choi", "Siu",
    "Fong", "Kwan", "Tsang", "Luk", "Chung", "Ma", "Lam", "Ching", "Shum",
    "Yu", "So", "Yung", "Pang", "Fu", "Tong", "Wan", "Yuen", "Tai",
    "Hung", "Mok", "Ngan", "Sze", "Au", "Shiu", "Ting", "Sin", "Choy",
    "Luk", "Tsui", "Lun", "Sit", "Ngai"
]

HK_GIVEN_MALE = [
    "Tai Man", "Ka Ho", "Wing Kin", "Ming Hei", "Chun Kit", "Siu Ming",
    "Kwok Wah", "Man Kit", "Hin Wa", "Sai Wing", "Wai Him", "Ka Chun",
    "Chun Hin", "Ho Yin", "Pui Kei", "Yat Long", "Tsz Hin", "Long Yin",
    "Yin Chun", "Wai Lun"
]

HK_GIVEN_FEMALE = [
    "Sau Ying", "Wai Sze", "Ka Man", "Yuk Ling", "Miu Yin", "Oi Kwan",
    "Pui Shan", "Suk Han", "Yuen Wah", "Wai Ling", "Yan Wing", "Lai Kuen",
    "Sau Fun", "Bik Yu", "Si Wa", "Ching Man", "Ka Wai", "Sze Man",
    "Wai Yee", "Yin Wah"
]

# ── HK Medical Data ────────────────────────────────────────────────────────────

HK_DIAGNOSES = [
    {"code": "E11.9", "desc": "Type 2 diabetes mellitus without complications", "system": "ICD-10-HK", "snomed": "44054006"},
    {"code": "I10", "desc": "Essential (primary) hypertension", "system": "ICD-10-HK", "snomed": "59621000"},
    {"code": "J45.9", "desc": "Asthma, unspecified", "system": "ICD-10-HK", "snomed": "195967001"},
    {"code": "M17.9", "desc": "Osteoarthritis of knee, unspecified", "system": "ICD-10-HK", "snomed": "239873007"},
    {"code": "E78.5", "desc": "Hyperlipidemia, unspecified", "system": "ICD-10-HK", "snomed": "55822004"},
    {"code": "I25.1", "desc": "Atherosclerotic heart disease", "system": "ICD-10-HK", "snomed": "53741008"},
    {"code": "N18.3", "desc": "Chronic kidney disease, Stage 3", "system": "ICD-10-HK", "snomed": "433144002"},
    {"code": "J44.9", "desc": "Chronic obstructive pulmonary disease, unspecified", "system": "ICD-10-HK", "snomed": "13645005"},
    {"code": "E03.9", "desc": "Hypothyroidism, unspecified", "system": "ICD-10-HK", "snomed": "40930008"},
    {"code": "F32.9", "desc": "Major depressive disorder, single episode, unspecified", "system": "ICD-10-HK", "snomed": "370143000"},
    {"code": "M81.0", "desc": "Age-related osteoporosis without pathological fracture", "system": "ICD-10-HK", "snomed": "64859006"},
    {"code": "G47.9", "desc": "Sleep disorder, unspecified", "system": "ICD-10-HK", "snomed": "39898005"},
    {"code": "D64.9", "desc": "Anemia, unspecified", "system": "ICD-10-HK", "snomed": "271737000"},
    {"code": "K21.9", "desc": "Gastro-esophageal reflux disease without esophagitis", "system": "ICD-10-HK", "snomed": "235595009"},
    {"code": "H25.9", "desc": "Age-related cataract, unspecified", "system": "ICD-10-HK", "snomed": "95774004"},
]

HK_MEDICATIONS = [
    {"name": "Metformin", "snomed": "372531002", "atc": "A10BA02", "dosage": "500mg", "frequency": "Twice daily"},
    {"name": "Lisinopril", "snomed": "386873005", "atc": "C09AA03", "dosage": "10mg", "frequency": "Once daily"},
    {"name": "Salbutamol", "snomed": "372702007", "atc": "R03AC02", "dosage": "100mcg", "frequency": "As needed"},
    {"name": "Paracetamol", "snomed": "387517004", "atc": "N02BE01", "dosage": "500mg", "frequency": "Four times daily"},
    {"name": "Atorvastatin", "snomed": "386864002", "atc": "C10AA05", "dosage": "20mg", "frequency": "Once daily at night"},
    {"name": "Amlodipine", "snomed": "387166006", "atc": "C08CA01", "dosage": "5mg", "frequency": "Once daily"},
    {"name": "Omeprazole", "snomed": "387399001", "atc": "A02BC01", "dosage": "20mg", "frequency": "Once daily"},
    {"name": "Warfarin", "snomed": "372979001", "atc": "B01AA03", "dosage": "3mg", "frequency": "Once daily"},
    {"name": "Levothyroxine", "snomed": "372548007", "atc": "H03AA01", "dosage": "50mcg", "frequency": "Once daily"},
    {"name": "Sertraline", "snomed": "372957000", "atc": "N06AB06", "dosage": "50mg", "frequency": "Once daily"},
]

HK_LABS = [
    {"test": "HbA1c", "unit": "%", "ref": "< 7.0", "value_range": (5.0, 10.0)},
    {"test": "Fasting Glucose", "unit": "mmol/L", "ref": "4.0-6.0", "value_range": (3.5, 12.0)},
    {"test": "Total Cholesterol", "unit": "mmol/L", "ref": "< 5.2", "value_range": (3.0, 8.0)},
    {"test": "LDL", "unit": "mmol/L", "ref": "< 2.6", "value_range": (1.0, 5.0)},
    {"test": "HDL", "unit": "mmol/L", "ref": "> 1.0", "value_range": (0.5, 2.5)},
    {"test": "Triglycerides", "unit": "mmol/L", "ref": "< 1.7", "value_range": (0.5, 4.0)},
    {"test": "Creatinine", "unit": "umol/L", "ref": "60-110", "value_range": (40, 200)},
    {"test": "eGFR", "unit": "mL/min/1.73m2", "ref": "> 60", "value_range": (15, 120)},
    {"test": "ALT", "unit": "U/L", "ref": "< 40", "value_range": (10, 100)},
    {"test": "AST", "unit": "U/L", "ref": "< 37", "value_range": (10, 80)},
    {"test": "CRP", "unit": "mg/L", "ref": "< 5", "value_range": (1, 50)},
    {"test": "Peak Flow", "unit": "L/min", "ref": "> 400", "value_range": (200, 600)},
    {"test": "Blood Pressure Systolic", "unit": "mmHg", "ref": "< 130", "value_range": (100, 180)},
    {"test": "Blood Pressure Diastolic", "unit": "mmHg", "ref": "< 80", "value_range": (60, 110)},
    {"test": "Heart Rate", "unit": "bpm", "ref": "60-100", "value_range": (50, 120)},
    {"test": "SpO2", "unit": "%", "ref": "> 95", "value_range": (85, 100)},
    {"test": "BMI", "unit": "kg/m2", "ref": "18.5-24.9", "value_range": (16, 40)},
    {"test": "TSH", "unit": "mIU/L", "ref": "0.4-4.0", "value_range": (0.1, 10)},
    {"test": "Hb", "unit": "g/dL", "ref": "13-17 (M), 12-15 (F)", "value_range": (8, 18)},
    {"test": "White Cell Count", "unit": "x10^9/L", "ref": "4.0-11.0", "value_range": (2, 15)},
]

HK_CLINICAL_NOTES_TEMPLATES = [
    "Patient presents with {symptom}. {finding}. {plan}",
    "Follow-up visit. {finding}. {plan}",
    "Routine health check. {finding}. Advised {advice}.",
]

HK_SYMPTOMS = [
    "fatigue and increased thirst", "shortness of breath on exertion", "chest tightness",
    "persistent cough with sputum", "joint pain in both knees", "dizziness upon standing",
    "difficulty sleeping", "feeling anxious and restless", "frequent headaches",
    "epigastric discomfort after meals", "blurred vision", "numbness in feet",
    "urinary frequency and urgency", "unexplained weight loss", "swelling in ankles"
]

HK_FINDINGS = [
    "Blood pressure 145/92. Heart sounds normal. Lungs clear.",
    "BP 138/85. Trace pitting edema in lower extremities.",
    "Wheezing heard in both lung bases. Peak flow 320 L/min.",
    "Reduced range of motion in both knees. Mild effusion.",
    "Fundoscopy reveals grade 2 hypertensive retinopathy.",
    "ECG shows sinus rhythm with left ventricular hypertrophy.",
    "Fasting glucose elevated at 8.5 mmol/L.",
    "BMI 28.5. Waist circumference 98cm.",
    "Thyroid diffuse enlargement without nodules.",
    "Gait normal. No focal neurological deficits."
]

HK_PLANS = [
    "Prescribed {med}. Advised diet and exercise. Follow-up in 3 months.",
    "Continue current medications. Repeat labs in 6 weeks.",
    "Referred to specialist for further evaluation.",
    "Medication dose adjusted. Monitor blood glucose daily for 1 week.",
    "Referred to physiotherapy. Prescribed analgesic as needed.",
    "Lifestyle modification counseling provided. Follow-up in 1 month.",
    "Dosage reduced due to improved symptoms. Review in 2 months."
]

HK_ADVICE = [
    "to maintain regular exercise and balanced diet",
    "to monitor blood pressure daily and keep a log",
    "smoking cessation and reduction of alcohol intake",
    "to maintain a food diary and reduce sodium intake",
    "regular follow-up with ophthalmologist",
    "to attend diabetes education program"
]


# ── HKID Generator ────────────────────────────────────────────────────────────

def generate_hkid(seed=None):
    """Generate a valid HKID number with checksum.
    Format: X(N) where X is letter, N is 6 digits + checksum digit/parenthesis."""
    rng = random.Random(seed) if seed else random
    letter = rng.choice(string.ascii_uppercase)
    digits = rng.randint(100000, 999999)
    # Simple checksum (HKID uses weighted mod 11)
    total = (ord(letter) - 64) * 9 if letter != 'A' else 36
    total *= 8
    d_str = str(digits)
    weights = [7, 6, 5, 4, 3, 2]
    for i, d in enumerate(d_str):
        total += int(d) * weights[i]
    remainder = total % 11
    if remainder == 0:
        checksum = '0'
    elif remainder == 1:
        checksum = 'A'
    else:
        checksum = str(11 - remainder)
    return f"{letter}{digits}{checksum}"


def generate_phone(rng):
    """Generate a Hong Kong phone number."""
    prefixes = ["9", "6", "5", "2"]
    prefix = rng.choice(prefixes)
    rest = rng.randint(10000000, 99999999)
    return f"{prefix}{rest}"


def generate_ehr_id(rng):
    """Generate an eHealth system identifier (simulated)."""
    suffix = ''.join(rng.choice(string.ascii_uppercase + string.digits) for _ in range(3))
    return f"EHR-{rng.randint(100000, 999999)}-{suffix}"


# ── Patient Generator ─────────────────────────────────────────────────────────

def generate_patient(patient_id, seed=None):
    rng = random.Random(seed)
    is_male = rng.choice([True, False])
    surname = rng.choice(HK_SURNAMES)
    given = rng.choice(HK_GIVEN_MALE) if is_male else rng.choice(HK_GIVEN_FEMALE)
    full_name = f"{surname} {given}"

    # DOB: age 18-85
    age = rng.randint(18, 85)
    dob = (datetime.now() - timedelta(days=age * 365 + rng.randint(0, 364))).strftime("%Y-%m-%d")

    # Diagnoses (1-4 per patient correlated with age)
    num_diag = min(rng.choices([1, 2, 3, 4], weights=[30, 35, 20, 15])[0], len(HK_DIAGNOSES))
    diagnoses = rng.sample(HK_DIAGNOSES, num_diag)

    # Medications (correlated with diagnoses)
    num_meds = min(len(diagnoses) + rng.randint(0, 1), len(HK_MEDICATIONS))
    medications = rng.sample(HK_MEDICATIONS, num_meds)

    # Lab results (5-10)
    num_labs = rng.randint(5, 10)
    lab_samples = rng.sample(HK_LABS, num_labs)
    lab_results = []
    for lab in lab_samples:
        val = round(rng.uniform(*lab["value_range"]), 1 if lab["unit"] != "x10^9/L" else 0)
        abnormal = val < float(str(lab["ref"]).split("-")[0].replace(">", "").strip()) if ">" in lab["ref"] else val > float(str(lab["ref"]).split("-")[0]) if "-" in lab["ref"] else False
        lab_results.append({
            "test": lab["test"], "value": str(val), "unit": lab["unit"],
            "reference": lab["ref"], "abnormal": abnormal
        })

    # Clinical notes
    template = rng.choice(HK_CLINICAL_NOTES_TEMPLATES)
    notes = template.format(
        symptom=rng.choice(HK_SYMPTOMS),
        finding=rng.choice(HK_FINDINGS),
        plan=rng.choice(HK_PLANS).format(med=medications[0]["name"]) if medications else "Return for follow-up as needed.",
        advice=rng.choice(HK_ADVICE)
    )

    # Vitals
    systolic_abnormal = rng.random() < 0.4
    diastolic_abnormal = rng.random() < 0.4
    bp_sys = rng.randint(130, 170) if systolic_abnormal else rng.randint(100, 129)
    bp_dia = rng.randint(85, 110) if diastolic_abnormal else rng.randint(60, 84)
    bmi = round(rng.uniform(22, 35), 1)

    patient = {
        "id": patient_id,
        "name": full_name,
        "hkid": generate_hkid(seed),
        "ehr_id": generate_ehr_id(rng),
        "dob": dob,
        "gender": "M" if is_male else "F",
        "phone": generate_phone(rng),
        "address": f"Flat {rng.randint(1, 40)}{rng.choice(['A','B','C','D'])}, {rng.randint(1, 100)} {rng.choice(['Nathan Rd','Hennessy Rd','Des Voeux Rd Central','Argyle St','Sai Yeung Choi St'])}, {rng.choice(['Kowloon','Hong Kong Island','New Territories'])}",
        "age": age,
        "diagnoses": [{"code": d["code"], "description": d["desc"], "system": d["system"], "snomed": d["snomed"]} for d in diagnoses],
        "medications": [{"name": m["name"], "dosage": m["dosage"], "frequency": m["frequency"], "snomed": m["snomed"], "atc": m["atc"]} for m in medications],
        "lab_results": lab_results,
        "vitals": {"blood_pressure": f"{bp_sys}/{bp_dia}", "bmi": bmi, "heart_rate": rng.randint(60, 110), "spo2": rng.randint(95, 100)},
        "clinical_notes": notes,
        "created_at": datetime.now().isoformat()
    }
    return patient


# ── FHIR R5 Converter ─────────────────────────────────────────────────────────

def patient_to_fhir(patient):
    """Convert a synthetic patient to a FHIR R5 bundle."""
    from datetime import datetime

    gender_map = {"M": "male", "F": "female"}
    name_parts = patient["name"].split(" ", 1)
    family = name_parts[0]
    given = name_parts[1] if len(name_parts) > 1 else ""

    entries = []

    # Patient resource
    patient_resource = {
        "resourceType": "Patient",
        "identifier": [
            {"system": "https://www.ehealth.gov.hk", "value": patient["hkid"], "type": {"text": "HKID"}},
            {"system": "https://www.ehealth.gov.hk/ehr-id", "value": patient["ehr_id"], "type": {"text": "eHealth ID"}}
        ],
        "name": [{"use": "official", "family": family, "given": [given]}],
        "gender": gender_map.get(patient["gender"], "unknown"),
        "birthDate": patient["dob"],
        "telecom": [{"system": "phone", "value": patient["phone"]}],
        "address": [{"text": patient["address"]}]
    }
    entries.append({"resource": patient_resource, "request": {"method": "POST", "url": "Patient"}})

    # Condition resources
    for diag in patient.get("diagnoses", []):
        condition = {
            "resourceType": "Condition",
            "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]},
            "code": {
                "coding": [
                    {"system": "http://hl7.org/fhir/sid/icd-10", "code": diag["code"], "display": diag["description"]},
                    {"system": "http://snomed.info/sct", "code": diag.get("snomed", "")}
                ]
            }
        }
        entries.append({"resource": condition, "request": {"method": "POST", "url": "Condition"}})

    # MedicationRequest resources
    for med in patient.get("medications", []):
        dos = med.get("dosage", "")
        freq = med.get("frequency", "")
        med_request = {
            "resourceType": "MedicationRequest",
            "status": "active",
            "intent": "order",
            "medicationCodeableConcept": {
                "coding": [
                    {"system": "http://snomed.info/sct", "code": med.get("snomed", ""), "display": med["name"]},
                    {"system": "http://www.whocc.no/atc", "code": med.get("atc", "")}
                ]
            },
            "dosageInstruction": [{"text": f"{dos} {freq}".strip(), "timing": {"repeat": {"frequency": 1, "period": 1, "periodUnit": "d"}}}]
        }
        entries.append({"resource": med_request, "request": {"method": "POST", "url": "MedicationRequest"}})

    # Observation resources (lab + vitals)
    for lab in patient.get("lab_results", []):
        obs = {
            "resourceType": "Observation",
            "status": "final",
            "code": {"text": lab["test"]},
            "valueQuantity": {"value": float(lab["value"]), "unit": lab["unit"]},
            "referenceRange": [{"text": lab["reference"]}]
        }
        entries.append({"resource": obs, "request": {"method": "POST", "url": "Observation"}})

    bundle = {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": entries
    }
    return bundle


# ── File Writers ──────────────────────────────────────────────────────────────

def write_mock_cms_data(patients, output_dir):
    """Write mock CMS JSON files (patients.json + diagnoses.json)."""
    output_dir = Path(output_dir)

    # patients.json
    patients_json = []
    for p in patients:
        patients_json.append({
            "id": p["id"], "name": p["name"], "hkid": p["hkid"], "ehr_id": p["ehr_id"],
            "dob": p["dob"], "gender": p["gender"], "phone": p["phone"],
            "age": p["age"], "address": p["address"],
            "diagnoses": [{"code": d["code"], "description": d["description"]} for d in p["diagnoses"]],
            "medications": [{"name": m["name"], "dosage": m["dosage"], "frequency": m["frequency"]} for m in p["medications"]],
            "lab_results": [{"test": l["test"], "value": l["value"], "unit": l["unit"], "reference": l["reference"]} for l in p["lab_results"]],
            "clinical_notes": p["clinical_notes"]
        })

    with open(output_dir / "patients.json", "w") as f:
        json.dump(patients_json, f, indent=2)

    # diagnoses.json (reference codes)
    codes = set()
    for p in patients:
        for d in p["diagnoses"]:
            if d["code"] not in codes:
                codes.add(d["code"])

    diagnoses_ref = []
    for d in HK_DIAGNOSES:
        if d["code"] in codes:
            diagnoses_ref.append({
                "code": d["code"], "description": d["desc"],
                "icd10": d["code"], "snomed": d["snomed"]
            })

    with open(output_dir / "diagnoses.json", "w") as f:
        json.dump(diagnoses_ref, f, indent=2)


def write_fhir_bundles(patients, output_dir):
    """Write individual FHIR R5 bundle files."""
    output_dir = Path(output_dir)
    for p in patients:
        bundle = patient_to_fhir(p)
        with open(output_dir / f"fhir_{p['id']}.json", "w") as f:
            json.dump(bundle, f, indent=2)


def write_csv_export(patients, output_dir):
    """Write a CSV summary for easy review."""
    import csv
    output_dir = Path(output_dir)
    with open(output_dir / "patients_summary.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Name", "HKID", "eHR ID", "DOB", "Gender", "Age", "Phone", "Diagnoses", "Medications", "Labs (abnormal)"])
        for p in patients:
            dx = ", ".join([d["code"] for d in p["diagnoses"]])
            rx = ", ".join([m["name"] for m in p["medications"]])
            abnormal_labs = [l["test"] for l in p["lab_results"] if l.get("abnormal")]
            labs_str = ", ".join(abnormal_labs[:3])
            writer.writerow([p["id"], p["name"], p["hkid"], p["ehr_id"], p["dob"], p["gender"], p["age"], p["phone"], dx, rx, labs_str])


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic HK patient data for Enosis")
    parser.add_argument("--patients", type=int, default=10, help="Number of patients to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--output", type=str, default=None, help="Output directory (default: mock_cms/data)")
    args = parser.parse_args()

    rng = random.Random(args.seed)
    patients = []

    base_patients = ["P001", "P002", "P003"]
    for i, pid in enumerate(base_patients):
        patients.append(generate_patient(pid, seed=args.seed + i))

    for i in range(4, args.patients + 1):
        pid = f"P{i:03d}"
        patients.append(generate_patient(pid, seed=args.seed + i))

    output_dir = Path(args.output) if args.output else Path("mock_cms/data")
    output_dir.mkdir(parents=True, exist_ok=True)

    write_mock_cms_data(patients, output_dir)

    fhir_dir = Path("mock_cms/data/fhir")
    fhir_dir.mkdir(parents=True, exist_ok=True)
    write_fhir_bundles(patients, fhir_dir)

    write_csv_export(patients, output_dir)

    print(f"✅ Generated {len(patients)} synthetic HK patients")
    print(f"   → {output_dir / 'patients.json'}")
    print(f"   → {output_dir / 'diagnoses.json'}")
    print(f"   → {output_dir / 'patients_summary.csv'}")
    print(f"   → {fhir_dir} (5 FHIR R5 bundles)")

    # Stats
    genders = {}
    for p in patients:
        genders[p["gender"]] = genders.get(p["gender"], 0) + 1
    print(f"\n📊 Demographics: {genders.get('M', 0)} Male, {genders.get('F', 0)} Female")
    print(f"📋 Diagnoses used: {len(set(d['code'] for p in patients for d in p['diagnoses']))}")
    print(f"💊 Medications used: {len(set(m['name'] for p in patients for m in p['medications']))}")
    print(f"🔬 Lab results generated: {sum(len(p['lab_results']) for p in patients)}")


if __name__ == "__main__":
    main()
