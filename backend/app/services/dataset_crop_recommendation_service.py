import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Crop parameter bounds derived from Kaggle Crop Recommendation Dataset
CROP_DATASET_RULES = [
    {
        "crop": "Rice",
        "n_range": (60, 120), "p_range": (35, 60), "k_range": (35, 45),
        "ph_range": (5.0, 7.8), "temp_range": (20, 27), "humidity_range": (80, 90), "rainfall_range": (150, 300)
    },
    {
        "crop": "Maize",
        "n_range": (60, 100), "p_range": (35, 60), "k_range": (15, 25),
        "ph_range": (5.5, 7.5), "temp_range": (18, 27), "humidity_range": (55, 75), "rainfall_range": (60, 110)
    },
    {
        "crop": "Chickpea",
        "n_range": (20, 60), "p_range": (55, 80), "k_range": (75, 85),
        "ph_range": (6.0, 8.5), "temp_range": (17, 22), "humidity_range": (14, 20), "rainfall_range": (65, 95)
    },
    {
        "crop": "Kidneybeans",
        "n_range": (15, 40), "p_range": (55, 80), "k_range": (15, 25),
        "ph_range": (5.5, 6.0), "temp_range": (15, 24), "humidity_range": (18, 25), "rainfall_range": (60, 150)
    },
    {
        "crop": "Pigeonpeas",
        "n_range": (15, 40), "p_range": (55, 80), "k_range": (15, 25),
        "ph_range": (4.5, 7.5), "temp_range": (18, 38), "humidity_range": (30, 70), "rainfall_range": (90, 200)
    },
    {
        "crop": "Mothbeans",
        "n_range": (0, 40), "p_range": (35, 60), "k_range": (15, 25),
        "ph_range": (3.5, 10.0), "temp_range": (24, 32), "humidity_range": (40, 65), "rainfall_range": (30, 70)
    },
    {
        "crop": "Blackgram",
        "n_range": (40, 60), "p_range": (55, 80), "k_range": (15, 25),
        "ph_range": (6.5, 7.5), "temp_range": (25, 35), "humidity_range": (60, 70), "rainfall_range": (60, 75)
    },
    {
        "crop": "Lentil",
        "n_range": (15, 40), "p_range": (55, 80), "k_range": (15, 25),
        "ph_range": (5.5, 7.0), "temp_range": (18, 30), "humidity_range": (60, 70), "rainfall_range": (40, 55)
    },
    {
        "crop": "Pomegranate",
        "n_range": (15, 40), "p_range": (10, 30), "k_range": (35, 45),
        "ph_range": (5.5, 7.2), "temp_range": (18, 25), "humidity_range": (85, 95), "rainfall_range": (100, 110)
    },
    {
        "crop": "Banana",
        "n_range": (80, 120), "p_range": (70, 95), "k_range": (45, 55),
        "ph_range": (5.5, 6.5), "temp_range": (25, 30), "humidity_range": (75, 85), "rainfall_range": (90, 120)
    },
    {
        "crop": "Mango",
        "n_range": (15, 40), "p_range": (15, 40), "k_range": (25, 35),
        "ph_range": (4.5, 7.0), "temp_range": (27, 36), "humidity_range": (45, 55), "rainfall_range": (80, 100)
    },
    {
        "crop": "Grapes",
        "n_range": (15, 40), "p_range": (120, 145), "k_range": (195, 205),
        "ph_range": (5.5, 6.5), "temp_range": (8, 42), "humidity_range": (80, 85), "rainfall_range": (60, 75)
    },
    {
        "crop": "Watermelon",
        "n_range": (80, 120), "p_range": (5, 30), "k_range": (45, 55),
        "ph_range": (6.0, 7.0), "temp_range": (24, 27), "humidity_range": (80, 90), "rainfall_range": (40, 60)
    },
    {
        "crop": "Apple",
        "n_range": (0, 40), "p_range": (120, 145), "k_range": (195, 205),
        "ph_range": (5.5, 6.5), "temp_range": (21, 24), "humidity_range": (90, 95), "rainfall_range": (100, 125)
    },
    {
        "crop": "Orange",
        "n_range": (0, 40), "p_range": (5, 30), "k_range": (5, 15),
        "ph_range": (6.0, 7.5), "temp_range": (10, 35), "humidity_range": (90, 95), "rainfall_range": (100, 120)
    },
    {
        "crop": "Cotton",
        "n_range": (100, 140), "p_range": (35, 60), "k_range": (15, 25),
        "ph_range": (6.0, 8.0), "temp_range": (22, 26), "humidity_range": (75, 85), "rainfall_range": (60, 90)
    },
    {
        "crop": "Coffee",
        "n_range": (80, 120), "p_range": (15, 40), "k_range": (25, 35),
        "ph_range": (6.0, 7.5), "temp_range": (23, 28), "humidity_range": (50, 70), "rainfall_range": (115, 190)
    }
]


class DatasetCropRecommendationService:
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
        Recommends crops based on Kaggle Crop Recommendation Dataset parameters:
        N, P, K, pH, Temperature, Humidity, and Rainfall.
        """
        scored_crops = []

        for item in CROP_DATASET_RULES:
            crop_name = item["crop"]
            score = 0.0

            # Match Nitrogen
            if item["n_range"][0] <= n <= item["n_range"][1]:
                score += 1.5
            # Match Phosphorus
            if item["p_range"][0] <= p <= item["p_range"][1]:
                score += 1.5
            # Match Potassium
            if item["k_range"][0] <= k <= item["k_range"][1]:
                score += 1.5
            # Match pH
            if item["ph_range"][0] <= ph <= item["ph_range"][1]:
                score += 2.0
            # Match Temp
            if item["temp_range"][0] <= temp <= item["temp_range"][1]:
                score += 1.0
            # Match Humidity
            if item["humidity_range"][0] <= humidity <= item["humidity_range"][1]:
                score += 1.0

            scored_crops.append({
                "crop": crop_name,
                "suitability_score": round(score, 2),
                "max_score": 8.5
            })

        scored_crops.sort(key=lambda x: x["suitability_score"], reverse=True)
        return scored_crops[:5]


dataset_crop_service = DatasetCropRecommendationService()
