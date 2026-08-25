"""
Comprehensive Test Script for Location-Based Agricultural Analysis Module in FarmAssist AI.
Tests:
1. Scenario 1: Kakinada, Andhra Pradesh
2. Scenario 2: Chennai, Tamil Nadu
3. Verifies location-specific weather, climate, soil baseline, crop suitability, disease risk, and recommendations.
4. Verifies Multilingual support across English, Telugu, Tamil, and Hindi.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, r"c:\Charan\Farm Assist Ai\backend")

from app.services.farm_analysis_service import farm_analysis_service

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
    assert "live_weather" in res, "Missing live weather"
    assert "climate_context" in res, "Missing climate context"
    assert "East Coast" in res["climate_context"]["zone_name"], f"Unexpected climate zone: {res['climate_context']['zone_name']}"
    assert "regional_soil_analysis" in res, "Missing regional soil analysis"
    assert "crop_suitability" in res, "Missing crop suitability"
    assert "disease_risk" in res, "Missing disease risk"

    print("     [OK] Weather Temp:", res["live_weather"]["temperature"], "°C, Humidity:", res["live_weather"]["humidity"], "%")
    print("     [OK] Climate Zone:", res["climate_context"]["zone_name"])
    print("     [OK] Soil Type:", res["regional_soil_analysis"]["regional_soil_type"])
    print("     [OK] Recommended Crop:", res["crop_suitability"]["recommended_crop"])

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
    assert "North Eastern Agro-Climatic Zone" in res["climate_context"]["zone_name"], f"Unexpected climate zone: {res['climate_context']['zone_name']}"
    assert "North-East Monsoon" in res["climate_context"]["monsoon_type"], f"Unexpected monsoon: {res['climate_context']['monsoon_type']}"

    print("     [OK] Weather Temp:", res["live_weather"]["temperature"], "°C, Humidity:", res["live_weather"]["humidity"], "%")
    print("     [OK] Climate Zone:", res["climate_context"]["zone_name"])
    print("     [OK] Monsoon Pattern:", res["climate_context"]["monsoon_type"])
    print("     [OK] Recommended Crop:", res["crop_suitability"]["recommended_crop"])

def test_multilingual_outputs():
    print("\n[TEST 3] Testing Multilingual Outputs (English, Telugu, Tamil, Hindi)...")
    for lang in ["en", "te", "ta", "hi"]:
        res = farm_analysis_service.analyze_farm(
            location="Kakinada, Andhra Pradesh",
            state="Andhra Pradesh",
            district="Kakinada",
            language=lang
        )
        assert res["weather_impact"] is not None, f"Failed weather impact for {lang}"
        assert res["recommended_action"] is not None, f"Failed recommendation for {lang}"
        impact_snippet = res['weather_impact'][:40].encode('ascii', errors='ignore').decode('ascii') or f"{len(res['weather_impact'])} chars"
        print(f"     [OK] {lang.upper()} Weather Impact: {impact_snippet}")

if __name__ == "__main__":
    test_location_scenario_1()
    test_location_scenario_2()
    test_multilingual_outputs()
    print("\n==============================================================")
    print("SUCCESS: All Location-Based Agricultural Analysis tests passed!")
    print("==============================================================")
