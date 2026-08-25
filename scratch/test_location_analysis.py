"""
Comprehensive Technical Audit Test Script for Location-Based Agricultural Analysis Module.
Verifies:
1. Scenario 1: Kakinada, Andhra Pradesh
2. Scenario 2: Chennai, Tamil Nadu
3. Data Honesty & Precision:
   - District-level baseline vs State-level baseline
   - Disease risk: "No crop image analysis available." when image is absent
   - Climate data classification: "Knowledge-base / Static Regional Context"
4. Weather API Fallbacks & Error Handling
5. Multilingual Outputs (English, Telugu, Tamil, Hindi)
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, r"c:\Charan\Farm Assist Ai\backend")

from app.services.farm_analysis_service import farm_analysis_service
from app.services.weather_service import weather_service

def test_location_scenario_1():
    print("[TEST 1] Testing Location Scenario 1: Kakinada, Andhra Pradesh")
    res = farm_analysis_service.analyze_farm(
        location="Kakinada, Andhra Pradesh",
        state="Andhra Pradesh",
        district="Kakinada",
        latitude=16.98,
        longitude=82.24,
        language="en"
    )

    assert res["location"]["district"] == "Kakinada", "District mismatch"
    assert res["location"]["state"] == "Andhra Pradesh", "State mismatch"
    assert res["regional_soil_analysis"]["baseline_precision"] == "District-level regional baseline", f"Precision error: {res['regional_soil_analysis']['baseline_precision']}"
    assert res["disease_risk"]["model_diagnosis"] == "No crop image analysis available.", "Disease risk diagnosis error"
    assert res["climate_context"]["data_classification"] == "Knowledge-base / Static Regional Context", "Climate classification error"

    print("     [OK] Weather Temp:", res["live_weather"]["temperature"], "°C, Humidity:", res["live_weather"]["humidity"], "%")
    print("     [OK] Climate Zone:", res["climate_context"]["zone_name"])
    print("     [OK] Soil Precision:", res["regional_soil_analysis"]["baseline_precision"])
    print("     [OK] Disease Model Diagnosis:", res["disease_risk"]["model_diagnosis"])

def test_location_scenario_2():
    print("\n[TEST 2] Testing Location Scenario 2: Chennai, Tamil Nadu")
    res = farm_analysis_service.analyze_farm(
        location="Chennai, Tamil Nadu",
        state="Tamil Nadu",
        district="Chennai",
        latitude=13.08,
        longitude=80.27,
        language="ta"
    )

    assert res["location"]["district"] == "Chennai", "District mismatch"
    assert res["location"]["state"] == "Tamil Nadu", "State mismatch"
    assert res["regional_soil_analysis"]["baseline_precision"] == "State-level regional baseline", f"Precision error: {res['regional_soil_analysis']['baseline_precision']}"
    assert "North Eastern Agro-Climatic Zone" in res["climate_context"]["zone_name"], f"Unexpected zone: {res['climate_context']['zone_name']}"

    print("     [OK] Weather Temp:", res["live_weather"]["temperature"], "°C, Humidity:", res["live_weather"]["humidity"], "%")
    print("     [OK] Climate Zone:", res["climate_context"]["zone_name"])
    print("     [OK] Monsoon Pattern:", res["climate_context"]["monsoon_type"])
    print("     [OK] Soil Precision:", res["regional_soil_analysis"]["baseline_precision"])

def test_weather_fallback():
    print("\n[TEST 3] Testing Weather API Fallback & Resilience...")
    # Force fallback by passing invalid location coordinates
    res = farm_analysis_service.analyze_farm(
        location="Unknown District, Andhra Pradesh",
        state="Andhra Pradesh",
        district="Unknown District",
        latitude=999.0,
        longitude=999.0,
        language="en"
    )
    assert res["live_weather"] is not None, "Live weather object missing during fallback"
    print("     [OK] Fallback Weather Source:", res["live_weather"]["source"])
    print("     [OK] Fallback Status Message:", res["live_weather"]["status"])

def test_multilingual_outputs():
    print("\n[TEST 4] Testing Multilingual Outputs (English, Telugu, Tamil, Hindi)...")
    for lang in ["en", "te", "ta", "hi"]:
        res = farm_analysis_service.analyze_farm(
            location="Kakinada, Andhra Pradesh",
            state="Andhra Pradesh",
            district="Kakinada",
            language=lang
        )
        assert res["weather_impact"] is not None, f"Failed weather impact for {lang}"
        assert res["recommended_action"] is not None, f"Failed recommendation for {lang}"
        print(f"     [OK] {lang.upper()} Analysis Generated Successfully.")

if __name__ == "__main__":
    test_location_scenario_1()
    test_location_scenario_2()
    test_weather_fallback()
    test_multilingual_outputs()
    print("\n==========================================================================")
    print("SUCCESS: All Location-Based Agricultural Analysis Audit Tests Passed!")
    print("==========================================================================")
