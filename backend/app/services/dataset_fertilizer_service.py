import os
import csv
import logging
from typing import Dict, Any, List
from collections import defaultdict

logger = logging.getLogger(__name__)

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "fertilizer_prediction", "fertilizer_prediction.csv")

FERTILIZER_METADATA = {
    "Urea": {
        "dose": "50-100 kg/acre in 2-3 split applications",
        "description": "Recommended for Nitrogen deficient soil to boost chlorophyll synthesis and rapid vegetative growth."
    },
    "DAP": {
        "dose": "50-75 kg/acre during basal soil preparation",
        "description": "Provides concentrated Phosphorus for strong root establishment, tillering, and early flowering."
    },
    "MOP": {
        "dose": "25-50 kg/acre basal or top dressing",
        "description": "Supplies Potassium for stem strength, disease resistance, drought tolerance, and grain filling."
    },
    "14-35-14": {
        "dose": "40-60 kg/acre basal dosage",
        "description": "High Phosphorus complex fertilizer suited for root crops, pulses, and oilseeds."
    },
    "28-28": {
        "dose": "50 kg/acre basal application",
        "description": "Equal ratio high-grade Nitrogen and Phosphorus fertilizer for cereals and sugarcane."
    },
    "17-17-17": {
        "dose": "50-75 kg/acre basal dosage",
        "description": "Balanced multi-nutrient complex for all-around crop development."
    },
    "20-20": {
        "dose": "50 kg/acre split dosage",
        "description": "Efficient ammoniacal nitrogen and water-soluble phosphate formulation."
    },
    "10-26-26": {
        "dose": "50-80 kg/acre basal application",
        "description": "High Potassium & Phosphorus blend for groundnut, pulses, and potassium-hungry soils."
    }
}


class DatasetFertilizerService:
    def __init__(self):
        self._dataset_records = []
        self._load_dataset()

    def _load_dataset(self):
        """Loads Kaggle Fertilizer Prediction Dataset from CSV."""
        if not os.path.exists(CSV_PATH):
            logger.warning(f"Fertilizer dataset not found at {CSV_PATH}.")
            return

        try:
            records = []
            with open(CSV_PATH, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append({
                        "temperature": float(row["Temparature"]),
                        "humidity": float(row["Humidity"]),
                        "moisture": float(row["Moisture"]),
                        "soil_type": row["Soil Type"].strip().title(),
                        "crop_type": row["Crop Type"].strip().title(),
                        "n": float(row["Nitrogen"]),
                        "k": float(row["Potassium"]),
                        "p": float(row["Phosphorous"]),
                        "fertilizer": row["Fertilizer Name"].strip()
                    })
            self._dataset_records = records
            logger.info(f"Loaded {len(records)} fertilizer recommendation records from {CSV_PATH}.")
        except Exception as e:
            logger.error(f"Error loading fertilizer_prediction.csv: {e}")

    def recommend_fertilizer(
        self,
        n: float = 80.0,
        p: float = 18.0,
        k: float = 40.0,
        soil_type: str = "Clayey",
        crop_name: str = "Rice"
    ) -> List[Dict[str, Any]]:
        """
        Predicts optimal fertilizers evaluated against the Kaggle Fertilizer Prediction Dataset.
        Matches nearest nutrient profiles, soil suitability, and crop type.
        """
        if not self._dataset_records:
            self._load_dataset()

        # Score candidate fertilizers from dataset
        scores = defaultdict(float)
        matched_records = defaultdict(int)

        clean_soil = soil_type.strip().title() if soil_type else "Loamy"
        clean_crop = crop_name.strip().title() if crop_name else "Rice"

        for rec in self._dataset_records:
            fert = rec["fertilizer"]

            # Calculate nutrient distance
            n_dist = abs(n - rec["n"])
            p_dist = abs(p - rec["p"])
            k_dist = abs(k - rec["k"])

            # Proximity score (lower distance = higher affinity)
            proximity = 100.0 / (1.0 + 0.05 * n_dist + 0.1 * p_dist + 0.05 * k_dist)

            # Bonus for matching soil type and crop type
            if rec["soil_type"] == clean_soil:
                proximity *= 1.2
            if rec["crop_type"].lower() in clean_crop.lower() or clean_crop.lower() in rec["crop_type"].lower():
                proximity *= 1.3

            scores[fert] += proximity
            matched_records[fert] += 1

        # Fallback to key deficiencies if dataset empty
        if not scores:
            if n < 50:
                scores["Urea"] = 100.0
            if p < 20:
                scores["DAP"] = 90.0
            if k < 50:
                scores["MOP"] = 80.0
            scores["17-17-17"] = 70.0

        ranked_ferts = sorted(scores.keys(), key=lambda f: scores[f], reverse=True)

        recommendations = []
        for fert in ranked_ferts[:3]:
            meta = FERTILIZER_METADATA.get(fert, {
                "dose": "50 kg/acre as per soil specialist consultation",
                "description": f"Standard {fert} application based on soil nutrient evaluation."
            })
            recommendations.append({
                "fertilizer": fert,
                "dosage": meta["dose"],
                "description": meta["description"],
                "applicable_crop": clean_crop,
                "soil_type_suited": clean_soil,
                "dataset_source": "Kaggle Fertilizer Prediction Dataset"
            })

        return recommendations


dataset_fertilizer_service = DatasetFertilizerService()
