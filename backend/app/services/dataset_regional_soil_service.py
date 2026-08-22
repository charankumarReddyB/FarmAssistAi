import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Baseline soil nutrient averages derived from Soil Nutrient Dataset of Southern Indian States
SOUTHERN_STATES_SOIL_DATA = {
    "andhra pradesh": {
        "kakinada": {"avg_n": 145.0, "avg_p": 18.5, "avg_k": 160.0, "avg_ph": 7.1, "soil_type": "Alluvial / Coastal Delta"},
        "guntur": {"avg_n": 160.0, "avg_p": 22.0, "avg_k": 180.0, "avg_ph": 7.4, "soil_type": "Black Cotton Soil"},
        "kurnool": {"avg_n": 125.0, "avg_p": 14.0, "avg_k": 130.0, "avg_ph": 7.8, "soil_type": "Red & Black Saline"},
        "default": {"avg_n": 140.0, "avg_p": 18.0, "avg_k": 150.0, "avg_ph": 7.2, "soil_type": "Red Loamy"}
    },
    "telangana": {
        "warangal": {"avg_n": 135.0, "avg_p": 16.0, "avg_k": 140.0, "avg_ph": 6.8, "soil_type": "Red Sandy Loam"},
        "default": {"avg_n": 130.0, "avg_p": 15.0, "avg_k": 135.0, "avg_ph": 6.9, "soil_type": "Red Chalkas"}
    },
    "tamil nadu": {
        "coimbatore": {"avg_n": 150.0, "avg_p": 20.0, "avg_k": 190.0, "avg_ph": 6.5, "soil_type": "Red Loam / Clay"},
        "madurai": {"avg_n": 130.0, "avg_p": 15.0, "avg_k": 140.0, "avg_ph": 7.0, "soil_type": "Black Soil"},
        "default": {"avg_n": 140.0, "avg_p": 17.0, "avg_k": 160.0, "avg_ph": 6.7, "soil_type": "Red Sandy"}
    },
    "karnataka": {
        "mysuru": {"avg_n": 155.0, "avg_p": 24.0, "avg_k": 175.0, "avg_ph": 6.4, "soil_type": "Red Sandy Loam"},
        "default": {"avg_n": 145.0, "avg_p": 20.0, "avg_k": 165.0, "avg_ph": 6.5, "soil_type": "Laterite & Red"}
    },
    "kerala": {
        "default": {"avg_n": 165.0, "avg_p": 28.0, "avg_k": 120.0, "avg_ph": 5.4, "soil_type": "Laterite Acidic Soil"}
    }
}


class DatasetRegionalSoilService:
    def analyze_regional_soil(
        self,
        state: str = "Andhra Pradesh",
        district: str = "Kakinada",
        report_n: float | None = None,
        report_p: float | None = None,
        report_k: float | None = None,
        report_ph: float | None = None
    ) -> Dict[str, Any]:
        """
        Analyzes farmer's soil test parameters against regional soil nutrient baselines
        from the Soil Nutrient Dataset of Southern Indian States.
        """
        state_clean = state.lower().strip()
        district_clean = district.lower().strip()

        state_data = SOUTHERN_STATES_SOIL_DATA.get(state_clean, SOUTHERN_STATES_SOIL_DATA["andhra pradesh"])
        regional_info = state_data.get(district_clean, state_data.get("default"))

        comparison = []

        if report_n is not None:
            diff_n = report_n - regional_info["avg_n"]
            status_n = "at regional average" if abs(diff_n) < 15 else ("above regional average" if diff_n > 0 else "below regional average")
            comparison.append(f"Nitrogen ({report_n} kg/ha) is {status_n} for {district.title()} (Regional avg: {regional_info['avg_n']} kg/ha).")

        if report_p is not None:
            diff_p = report_p - regional_info["avg_p"]
            status_p = "at regional average" if abs(diff_p) < 4 else ("above regional average" if diff_p > 0 else "below regional average")
            comparison.append(f"Phosphorus ({report_p} kg/ha) is {status_p} for {district.title()} (Regional avg: {regional_info['avg_p']} kg/ha).")

        if report_k is not None:
            diff_k = report_k - regional_info["avg_k"]
            status_k = "at regional average" if abs(diff_k) < 20 else ("above regional average" if diff_k > 0 else "below regional average")
            comparison.append(f"Potassium ({report_k} kg/ha) is {status_k} for {district.title()} (Regional avg: {regional_info['avg_k']} kg/ha).")

        return {
            "state": state,
            "district": district,
            "regional_soil_type": regional_info["soil_type"],
            "regional_baseline_npk": {
                "avg_n": regional_info["avg_n"],
                "avg_p": regional_info["avg_p"],
                "avg_k": regional_info["avg_k"],
                "avg_ph": regional_info["avg_ph"]
            },
            "regional_comparison_notes": comparison
        }


dataset_regional_soil_service = DatasetRegionalSoilService()
