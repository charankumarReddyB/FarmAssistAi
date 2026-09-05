import os
import csv
import logging
from typing import Dict, Any, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "soil_nutrients", "southern_indian_soil_nutrients.csv")


class DatasetRegionalSoilService:
    def __init__(self):
        self._district_data = {}
        self._state_data = {}
        self._load_dataset()

    def _load_dataset(self):
        """Loads and precomputes district and state nutrient baselines directly from CSV."""
        if not os.path.exists(CSV_PATH):
            logger.warning(f"Southern Indian soil dataset not found at {CSV_PATH}.")
            return

        try:
            district_records = defaultdict(lambda: {"n": [], "p": [], "k": [], "ph": [], "soils": []})
            state_records = defaultdict(lambda: {"n": [], "p": [], "k": [], "ph": [], "soils": []})

            with open(CSV_PATH, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    st = row["State"].strip().lower()
                    dist = row["District"].strip().lower()
                    n = float(row["Nitrogen"])
                    p = float(row["Phosphorus"])
                    k = float(row["Potassium"])
                    ph = float(row["pH"])
                    soil = row["Soil_Type"].strip()

                    key = (st, dist)
                    district_records[key]["n"].append(n)
                    district_records[key]["p"].append(p)
                    district_records[key]["k"].append(k)
                    district_records[key]["ph"].append(ph)
                    district_records[key]["soils"].append(soil)

                    state_records[st]["n"].append(n)
                    state_records[st]["p"].append(p)
                    state_records[st]["k"].append(k)
                    state_records[st]["ph"].append(ph)
                    state_records[st]["soils"].append(soil)

            # Compute district baselines
            self._district_data = {}
            for (st, dist), vals in district_records.items():
                self._district_data[(st, dist)] = {
                    "avg_n": round(sum(vals["n"]) / len(vals["n"]), 1),
                    "avg_p": round(sum(vals["p"]) / len(vals["p"]), 1),
                    "avg_k": round(sum(vals["k"]) / len(vals["k"]), 1),
                    "avg_ph": round(sum(vals["ph"]) / len(vals["ph"]), 2),
                    "soil_type": max(set(vals["soils"]), key=vals["soils"].count)
                }

            # Compute state baselines
            self._state_data = {}
            for st, vals in state_records.items():
                self._state_data[st] = {
                    "avg_n": round(sum(vals["n"]) / len(vals["n"]), 1),
                    "avg_p": round(sum(vals["p"]) / len(vals["p"]), 1),
                    "avg_k": round(sum(vals["k"]) / len(vals["k"]), 1),
                    "avg_ph": round(sum(vals["ph"]) / len(vals["ph"]), 2),
                    "soil_type": max(set(vals["soils"]), key=vals["soils"].count)
                }

            logger.info(f"Loaded {len(self._district_data)} districts across {len(self._state_data)} Southern Indian states from {CSV_PATH}.")
        except Exception as e:
            logger.error(f"Error parsing southern_indian_soil_nutrients.csv: {e}")

    def analyze_regional_soil(
        self,
        state: str = "Andhra Pradesh",
        district: str = "Kakinada",
        report_n: Optional[float] = None,
        report_p: Optional[float] = None,
        report_k: Optional[float] = None,
        report_ph: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Analyzes farmer's soil test parameters against regional soil nutrient baselines
        from the Soil Nutrient Dataset of Southern Indian States.
        Directly distinguishes district-level record vs. state-level baseline.
        """
        if not self._district_data:
            self._load_dataset()

        state_clean = state.lower().strip() if state else "andhra pradesh"
        district_clean = district.lower().strip() if district else "kakinada"

        is_district_level = False
        regional_info = None

        if (state_clean, district_clean) in self._district_data:
            regional_info = self._district_data[(state_clean, district_clean)]
            is_district_level = True
        elif state_clean in self._state_data:
            regional_info = self._state_data[state_clean]
        else:
            # Check if district matches any state
            for (st, dist), info in self._district_data.items():
                if dist == district_clean:
                    regional_info = info
                    is_district_level = True
                    break

        if not regional_info:
            return {
                "state": state,
                "district": district,
                "dataset_covered": False,
                "baseline_precision": "Unavailable",
                "regional_soil_type": "Coverage Unavailable",
                "regional_baseline_npk": None,
                "regional_comparison_notes": ["Detailed regional soil baseline is currently unavailable for this location."],
                "message": "Detailed regional soil baseline is currently unavailable for this location."
            }

        baseline_type = "District-level regional baseline" if is_district_level else "State-level regional baseline"
        region_label = district.title() if is_district_level else state.title()

        def _clean_num(val):
            if val is None:
                return None
            if isinstance(val, (int, float)):
                return float(val)
            if isinstance(val, dict):
                v = val.get("value")
                if v is not None:
                    try:
                        return float(v)
                    except (ValueError, TypeError):
                        pass
            try:
                return float(val)
            except (ValueError, TypeError):
                return None

        clean_n = _clean_num(report_n)
        clean_p = _clean_num(report_p)
        clean_k = _clean_num(report_k)

        comparison = []

        if clean_n is not None:
            diff_n = clean_n - regional_info["avg_n"]
            status_n = "at regional average" if abs(diff_n) < 15 else ("above regional average" if diff_n > 0 else "below regional average")
            comparison.append(f"Nitrogen ({clean_n} kg/ha) is {status_n} for {region_label} ({baseline_type} avg: {regional_info['avg_n']} kg/ha).")

        if clean_p is not None:
            diff_p = clean_p - regional_info["avg_p"]
            status_p = "at regional average" if abs(diff_p) < 4 else ("above regional average" if diff_p > 0 else "below regional average")
            comparison.append(f"Phosphorus ({clean_p} kg/ha) is {status_p} for {region_label} ({baseline_type} avg: {regional_info['avg_p']} kg/ha).")

        if clean_k is not None:
            diff_k = clean_k - regional_info["avg_k"]
            status_k = "at regional average" if abs(diff_k) < 20 else ("above regional average" if diff_k > 0 else "below regional average")
            comparison.append(f"Potassium ({clean_k} kg/ha) is {status_k} for {region_label} ({baseline_type} avg: {regional_info['avg_k']} kg/ha).")

        return {
            "state": state,
            "district": district,
            "dataset_covered": True,
            "baseline_precision": baseline_type,
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
