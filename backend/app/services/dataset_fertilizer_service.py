import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

FERTILIZER_KAGGLE_RULES = [
    {
        "fertilizer": "Urea (High Nitrogen)",
        "condition": lambda n, p, k: n < 50,
        "dose": "50-100 kg/acre in 2-3 split applications",
        "description": "Recommended for Nitrogen deficient soil to boost chlorophyll and leafy vegetative growth."
    },
    {
        "fertilizer": "DAP (Di-Ammonium Phosphate)",
        "condition": lambda n, p, k: p < 20,
        "dose": "50-75 kg/acre during basal soil preparation",
        "description": "Provides concentrated Phosphorus for strong root establishment and early flowering."
    },
    {
        "fertilizer": "MOP (Muriate of Potash)",
        "condition": lambda n, p, k: k < 50,
        "dose": "25-50 kg/acre",
        "description": "Supplies Potassium for stem strength, disease resistance, and grain weight."
    },
    {
        "fertilizer": "NPK 19-19-19 (Balanced Foliar)",
        "condition": lambda n, p, k: True,
        "dose": "5-10 kg/acre foliar spray or fertigation",
        "description": "Balanced macro-nutrient complex for overall plant health during active vegetative phase."
    },
    {
        "fertilizer": "14-35-14 / 10-26-26 Complex",
        "condition": lambda n, p, k: p < 30 and k < 60,
        "dose": "50 kg/acre basal dosage",
        "description": "Ideal for tuber, root, and pulse crops requiring high P and K ratios."
    }
]


class DatasetFertilizerService:
    def recommend_fertilizer(
        self,
        n: float = 80.0,
        p: float = 18.0,
        k: float = 40.0,
        soil_type: str = "Clayey",
        crop_name: str = "Rice"
    ) -> List[Dict[str, Any]]:
        """
        Predicts optimal fertilizers based on Kaggle Fertilizer Prediction Dataset parameters.
        """
        recommendations = []

        for rule in FERTILIZER_KAGGLE_RULES:
            if rule["condition"](n, p, k):
                recommendations.append({
                    "fertilizer": rule["fertilizer"],
                    "dosage": rule["dose"],
                    "description": rule["description"],
                    "applicable_crop": crop_name,
                    "soil_type_suited": soil_type
                })

        return recommendations[:3]


dataset_fertilizer_service = DatasetFertilizerService()
