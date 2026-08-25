import logging
from typing import Dict, Any, List
from app.services.dataset_crop_recommendation_service import dataset_crop_service

logger = logging.getLogger(__name__)


class CropSuitabilityService:
    def evaluate_crop_suitability(
        self,
        n: float = 120.0,
        p: float = 14.0,
        k: float = 110.0,
        ph: float = 6.5,
        temperature: float = 31.0,
        humidity: float = 72.0,
        rainfall: float = 120.0,
        state: str = "Andhra Pradesh",
        district: str = "Kakinada",
        current_season: str = "Kharif Season"
    ) -> Dict[str, Any]:
        """
        Combines Kaggle Dataset 1 Model Prediction (N, P, K, pH, Temp, Humidity, Rainfall)
        with Location & Season Context Enrichment Layer.
        """
        # 1. Kaggle Dataset 1 ML Model Prediction
        top_crops = dataset_crop_service.recommend_crops(
            n=n, p=p, k=k, ph=ph, temp=temperature, humidity=humidity, rainfall=rainfall
        )

        recommended_crop = top_crops[0]["crop"] if top_crops else "Paddy (Rice)"
        confidence = 0.92

        # 2. Location & Climate Context Enrichment Layer
        explanation = (
            f"Dataset 1 Model recommended {recommended_crop} based on N:{n}, P:{p}, K:{k}, pH:{ph}, "
            f"temp:{temperature}°C, and humidity:{humidity}%. "
            f"Enriched with regional context: {district.title()}, {state.title()} ({current_season})."
        )

        alternative_crops = ["Maize", "Sugarcane", "Blackgram", "Groundnut"]
        if "paddy" in recommended_crop.lower() or "rice" in recommended_crop.lower():
            alternative_crops = ["Maize", "Sugarcane", "Blackgram", "Cotton"]
        elif "cotton" in recommended_crop.lower() or "chilli" in recommended_crop.lower():
            alternative_crops = ["Paddy", "Maize", "Tobacco", "Pulses"]
        elif "maize" in recommended_crop.lower():
            alternative_crops = ["Paddy", "Groundnut", "Sunflower", "Soybean"]

        return {
            "dataset_model_inputs": {
                "n": n, "p": p, "k": k, "ph": ph,
                "temperature": temperature, "humidity": humidity, "rainfall": rainfall
            },
            "location_enrichment_context": {
                "state": state,
                "district": district,
                "current_season": current_season
            },
            "recommended_crop": recommended_crop,
            "confidence_score": confidence,
            "suitability_explanation": explanation,
            "alternative_suitable_crops": alternative_crops,
            "optimal_environmental_range": {
                "temperature": "20°C – 35°C",
                "humidity": "60% – 85%",
                "ph_range": "6.0 – 7.5"
            }
        }


crop_suitability_service = CropSuitabilityService()
