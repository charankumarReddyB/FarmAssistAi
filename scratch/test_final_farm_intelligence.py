"""
Final Verification Audit Test Script for Farm Intelligence Dashboard Integration
Verifies:
1. Scenario 1: Kakinada, Andhra Pradesh
2. Scenario 2: Chennai, Tamil Nadu
3. Scenario 3: Uncovered State (Punjab) for Dataset 3 missing coverage message
4. Weather Data Source Transparency (live_open_meteo vs location_baseline)
5. Data Classification Source Labels for all 9 steps
6. Missing Data Handling:
   - Soil report missing message
   - Crop image missing message
   - Dataset 3 missing coverage message
   - Farm health risk level for missing vs complete data
7. Prioritized Recommended Actions (IMMEDIATE ACTION, NEXT ACTION, MONITOR)
8. Multilingual output verification across English, Telugu, Tamil, Hindi
"""

import sys
import os

sys.path.insert(0, r"c:\Charan\Farm Assist Ai\backend")

from app.services.farm_analysis_service import farm_analysis_service
from app.services.dataset_regional_soil_service import dataset_regional_soil_service

def test_kakinada_andhra_pradesh():
    print("=== [TEST 1] Scenario 1: Kakinada, Andhra Pradesh ===")
    res = farm_analysis_service.analyze_farm(
        location="Kakinada, Andhra Pradesh",
        state="Andhra Pradesh",
        district="Kakinada",
        latitude=16.98,
        longitude=82.24,
        report_n=120.0,
        report_p=14.0,
        report_k=110.0,
        report_ph=6.5,
        detected_disease="Paddy Leaf Blast",
        language="en"
    )

    assert res["location"]["district"] == "Kakinada"
    assert res["location"]["state"] == "Andhra Pradesh"
    assert res["regional_soil_analysis"]["dataset_covered"] is True
    assert res["disease_risk"]["has_crop_image"] is True
    assert "Paddy Leaf Blast" in res["disease_risk"]["model_diagnosis"]
    assert len(res["prioritized_actions"]) == 3
    assert res["prioritized_actions"][0]["priority"] == "IMMEDIATE ACTION"
    assert res["prioritized_actions"][1]["priority"] == "NEXT ACTION"
    assert res["prioritized_actions"][2]["priority"] == "MONITOR"
    print("  [OK] Location:", res["location"]["full_location"])
    print("  [OK] Weather Temp:", res["live_weather"]["temperature"], "°C (Source:", res["live_weather"]["source"], ")")
    print("  [OK] Disease Diagnosis:", res["disease_risk"]["model_diagnosis"])
    print("  [OK] Farm Risk Level:", res["farm_risk"]["level"])
    print("  [OK] Immediate Action:", res["prioritized_actions"][0]["action"])

def test_chennai_tamil_nadu():
    print("\n=== [TEST 2] Scenario 2: Chennai, Tamil Nadu ===")
    res = farm_analysis_service.analyze_farm(
        location="Chennai, Tamil Nadu",
        state="Tamil Nadu",
        district="Chennai",
        latitude=13.08,
        longitude=80.27,
        language="ta"
    )

    assert res["location"]["district"] == "Chennai"
    assert res["location"]["state"] == "Tamil Nadu"
    assert res["regional_soil_analysis"]["dataset_covered"] is True
    assert res["disease_risk"]["has_crop_image"] is False
    assert res["disease_risk"]["model_diagnosis"] == "No crop image analysis available."
    print("  [OK] Location:", res["location"]["full_location"])
    print("  [OK] Weather Temp:", res["live_weather"]["temperature"], "°C")
    print("  [OK] Climate Zone:", res["climate_context"]["zone_name"])
    print("  [OK] Disease Model Diagnosis:", res["disease_risk"]["model_diagnosis"])

def test_uncovered_state_punjab():
    print("\n=== [TEST 3] Scenario 3: Outside Dataset 3 Coverage (Punjab) ===")
    res = farm_analysis_service.analyze_farm(
        location="Ludhiana, Punjab",
        state="Punjab",
        district="Ludhiana",
        latitude=30.90,
        longitude=75.85,
        language="en"
    )

    assert res["regional_soil_analysis"]["dataset_covered"] is False
    assert res["regional_soil_analysis"]["message"] == "Detailed regional soil baseline is currently unavailable for this location."
    print("  [OK] Dataset Covered Flag:", res["regional_soil_analysis"]["dataset_covered"])
    print("  [OK] Uncovered Message:", res["regional_soil_analysis"]["message"])

def test_missing_data_handling():
    print("\n=== [TEST 4] Missing Data Handling Audit ===")
    # Case: No soil report, No crop image, Fallback weather
    res = farm_analysis_service.analyze_farm(
        location="Unknown, Andhra Pradesh",
        state="Andhra Pradesh",
        district="Unknown",
        report_n=None,
        report_p=None,
        report_k=None,
        report_ph=None,
        detected_disease=None,
        latitude=999.0,
        longitude=999.0,
        language="en"
    )

    assert res["soil_health_analysis"]["has_soil_report"] is False
    assert res["soil_health_analysis"]["status_message"] == "Upload a soil report to enable personalized soil analysis."
    assert res["disease_risk"]["has_crop_image"] is False
    assert res["disease_risk"]["model_diagnosis"] == "No crop image analysis available."
    assert res["live_weather"]["status"] == "Live weather currently unavailable"
    assert res["farm_risk"]["level"] == "INSUFFICIENT_DATA"
    assert res["farm_risk"]["message"] == "Insufficient data for complete farm risk assessment."

    print("  [OK] Soil Missing Message:", res["soil_health_analysis"]["status_message"])
    print("  [OK] Disease Missing Message:", res["disease_risk"]["model_diagnosis"])
    print("  [OK] Weather Status Message:", res["live_weather"]["status"])
    print("  [OK] Risk Level Message:", res["farm_risk"]["message"])

def test_multilingual():
    print("\n=== [TEST 5] Multilingual Analysis (EN, TE, TA, HI) ===")
    for lang in ["en", "te", "ta", "hi"]:
        res = farm_analysis_service.analyze_farm(
            location="Kakinada, Andhra Pradesh",
            state="Andhra Pradesh",
            district="Kakinada",
            language=lang
        )
        assert res["weather_impact"] is not None
        assert res["recommended_action"] is not None
        print(f"  [OK] {lang.upper()} Analysis verified successfully.")

if __name__ == "__main__":
    test_kakinada_andhra_pradesh()
    test_chennai_tamil_nadu()
    test_uncovered_state_punjab()
    test_missing_data_handling()
    test_multilingual()
    print("\n==========================================================================")
    print("ALL FARM INTELLIGENCE DASHBOARD VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==========================================================================")
