import os
import csv
import logging
from typing import Dict, Any, List
from collections import defaultdict

logger = logging.getLogger(__name__)

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "crop_recommendation", "crop_recommendation.csv")


class DatasetCropRecommendationService:
    def __init__(self):
        self._crop_profiles = {}
        self._load_dataset()

    def _load_dataset(self):
        """Loads and precomputes crop nutrient & climate profiles directly from crop_recommendation.csv."""
        if not os.path.exists(CSV_PATH):
            logger.warning(f"Crop dataset not found at {CSV_PATH}. Using default rules.")
            return

        try:
            crop_data = defaultdict(lambda: {
                "n": [], "p": [], "k": [], "temp": [], "humidity": [], "ph": [], "rainfall": []
            })

            with open(CSV_PATH, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    crop = row["label"].strip().title()
                    crop_data[crop]["n"].append(float(row["N"]))
                    crop_data[crop]["p"].append(float(row["P"]))
                    crop_data[crop]["k"].append(float(row["K"]))
                    crop_data[crop]["temp"].append(float(row["temperature"]))
                    crop_data[crop]["humidity"].append(float(row["humidity"]))
                    crop_data[crop]["ph"].append(float(row["ph"]))
                    crop_data[crop]["rainfall"].append(float(row["rainfall"]))

            profiles = {}
            for crop, values in crop_data.items():
                profiles[crop] = {
                    "crop": crop,
                    "avg_n": sum(values["n"]) / len(values["n"]),
                    "min_n": min(values["n"]), "max_n": max(values["n"]),
                    "avg_p": sum(values["p"]) / len(values["p"]),
                    "min_p": min(values["p"]), "max_p": max(values["p"]),
                    "avg_k": sum(values["k"]) / len(values["k"]),
                    "min_k": min(values["k"]), "max_k": max(values["k"]),
                    "avg_ph": sum(values["ph"]) / len(values["ph"]),
                    "min_ph": min(values["ph"]), "max_ph": max(values["ph"]),
                    "avg_temp": sum(values["temp"]) / len(values["temp"]),
                    "min_temp": min(values["temp"]), "max_temp": max(values["temp"]),
                    "avg_humidity": sum(values["humidity"]) / len(values["humidity"]),
                    "min_humidity": min(values["humidity"]), "max_humidity": max(values["humidity"]),
                    "avg_rainfall": sum(values["rainfall"]) / len(values["rainfall"]),
                    "min_rainfall": min(values["rainfall"]), "max_rainfall": max(values["rainfall"]),
                }

            self._crop_profiles = profiles
            logger.info(f"Loaded {len(profiles)} crop profiles from Kaggle Crop Recommendation Dataset ({CSV_PATH}).")
        except Exception as e:
            logger.error(f"Error parsing crop_recommendation.csv: {e}")

    def recommend_crops(
        self,
        n: float = 100.0,
        p: float = 30.0,
        k: float = 40.0,
        ph: float = 6.5,
        temp: float = 28.0,
        humidity: float = 75.0,
        rainfall: float = 100.0
    ) -> List[Dict[str, Any]]:
        """
        Recommends top suitable crops evaluated against the Kaggle Crop Recommendation Dataset.
        Uses multi-factor suitability scoring and provides explainable rationale.
        """
        if not self._crop_profiles:
            self._load_dataset()

        scored_crops = []

        for crop, prof in self._crop_profiles.items():
            score = 0.0
            reasons = []

            # 1. Nitrogen suitability
            if prof["min_n"] <= n <= prof["max_n"]:
                score += 1.5
                reasons.append("Optimal soil Nitrogen")
            elif abs(n - prof["avg_n"]) < 30:
                score += 0.8

            # 2. Phosphorus suitability
            if prof["min_p"] <= p <= prof["max_p"]:
                score += 1.5
                reasons.append("Optimal soil Phosphorus")
            elif abs(p - prof["avg_p"]) < 15:
                score += 0.8

            # 3. Potassium suitability
            if prof["min_k"] <= k <= prof["max_k"]:
                score += 1.5
                reasons.append("Optimal soil Potassium")
            elif abs(k - prof["avg_k"]) < 20:
                score += 0.8

            # 4. pH suitability
            if prof["min_ph"] <= ph <= prof["max_ph"]:
                score += 2.0
                reasons.append(f"Ideal soil pH ({round(ph, 1)})")
            elif abs(ph - prof["avg_ph"]) < 0.8:
                score += 1.0

            # 5. Temperature suitability
            if prof["min_temp"] <= temp <= prof["max_temp"]:
                score += 1.0
                reasons.append(f"Favorable ambient temperature ({round(temp, 1)}°C)")
            elif abs(temp - prof["avg_temp"]) < 5.0:
                score += 0.5

            # 6. Humidity suitability
            if prof["min_humidity"] <= humidity <= prof["max_humidity"]:
                score += 1.0
            elif abs(humidity - prof["avg_humidity"]) < 15.0:
                score += 0.5

            suitability_pct = min(100, int((score / 8.5) * 100))

            scored_crops.append({
                "crop": crop,
                "suitability_score": round(score, 2),
                "suitability_percentage": suitability_pct,
                "max_score": 8.5,
                "dataset_source": "Kaggle Crop Recommendation Dataset",
                "ideal_parameters": {
                    "n_range": f"{int(prof['min_n'])}-{int(prof['max_n'])} kg/ha",
                    "p_range": f"{int(prof['min_p'])}-{int(prof['max_p'])} kg/ha",
                    "k_range": f"{int(prof['min_k'])}-{int(prof['max_k'])} kg/ha",
                    "ph_range": f"{round(prof['min_ph'], 1)}-{round(prof['max_ph'], 1)}",
                    "optimal_temp": f"{int(prof['min_temp'])}-{int(prof['max_temp'])}°C"
                },
                "reasons": reasons[:3]
            })

        scored_crops.sort(key=lambda x: x["suitability_score"], reverse=True)
        return scored_crops[:5]


dataset_crop_service = DatasetCropRecommendationService()
