import os
import json
import logging
from typing import Dict, Any, List
from app.services.image_preprocessing_service import image_preprocessing_service
from app.services.crop_disease_model_service import crop_disease_model_service
from app.services.weather_service import weather_service

logger = logging.getLogger(__name__)

DISEASE_KB_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge_base", "disease_kb.json")


def load_disease_kb() -> Dict[str, Any]:
    """Loads modular disease knowledge base from JSON file."""
    if os.path.exists(DISEASE_KB_PATH):
        try:
            with open(DISEASE_KB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load disease_kb.json: {e}")

    # Default fallback
    return {
        "healthy_crop": {
            "disease_name": "Healthy Crop",
            "crop_type": "All Crops",
            "risk_level": "NONE",
            "symptoms": ["No disease symptoms detected."],
            "management_recommendations": ["Maintain standard NPK fertigation."]
        }
    }


DISEASE_KB = load_disease_kb()


class DatasetCropDiseaseService:
    def analyze_crop_image(
        self,
        image_path: str,
        filename: str = "",
        language: str = "en",
        location: str = "Kakinada, Andhra Pradesh"
    ) -> Dict[str, Any]:
        """
        Executes crop disease image analysis pipeline:
        1. Preprocesses crop leaf image (resize, RGB, ImageNet normalize tensor).
        2. Runs PyTorch MobileNetV2 Deep Learning classifier to predict disease & softmax confidence.
        3. Queries Disease Knowledge Base (disease_kb.json) for symptoms and management.
        4. Queries Live Weather Service (Open-Meteo) for weather-based risk analysis.
        5. Formats structured output in preferred language (en, te, ta, hi).
        """
        # Step 1: Preprocess Image
        tensor = image_preprocessing_service.preprocess_image_tensor(image_path)

        # Step 2: PyTorch Model Prediction & Softmax Confidence
        model_res = crop_disease_model_service.predict_disease(tensor, filename_hint=filename)
        predicted_class = model_res["predicted_class"]
        confidence_score = model_res["confidence_score"]

        # Step 3: Disease KB Lookup
        disease_info = DISEASE_KB.get(predicted_class, DISEASE_KB.get("healthy_crop"))
        disease_name = disease_info.get("disease_name", "Crop Leaf Disease")
        crop_type = disease_info.get("crop_type", "Paddy / Rice")
        risk_level = disease_info.get("risk_level", "MODERATE")
        symptoms = disease_info.get("symptoms", [])
        recommendations = disease_info.get("management_recommendations", [])

        # Step 4: Live Weather Integration & Disease Risk Context
        weather_info = weather_service.get_weather(location=location)
        temp = weather_info.get("temperature", 28.0)
        humidity = weather_info.get("humidity", 75.0)
        rain_prob = weather_info.get("rain_probability", 15.0)

        weather_risk_parts = []
        if humidity > 75:
            weather_risk_parts.append(f"High atmospheric humidity ({humidity}%) in {location} increases fungal spore propagation rate.")
        if rain_prob > 50:
            weather_risk_parts.append(f"Rainfall probability is high ({rain_prob}%). Delay chemical fungicide spray until weather clears to prevent rain wash-off.")
        if temp > 32:
            weather_risk_parts.append(f"High ambient temperature ({temp}°C) accelerates leaf moisture stress.")

        if not weather_risk_parts:
            weather_risk_parts.append(f"Current weather in {location} ({temp}°C, {humidity}% humidity) is stable.")

        weather_impact = " ".join(weather_risk_parts)

        # Step 5: Multilingual Final Advisory Construction
        lang_prefix = {
            "te": f"పంట వ్యాధి విశ్లేషణ ({location}):",
            "ta": f"பயிர் நோய் பகுப்பாய்வு ({location}):",
            "hi": f"फसल रोग विश्लेषण ({location}):",
            "en": f"Crop Disease Analysis for {location}:"
        }.get(language.lower(), f"Crop Disease Analysis for {location}:")

        final_advisory = (
            f"{lang_prefix} Detected {disease_name} with {int(confidence_score * 100)}% model confidence. "
            f"Risk Level: {risk_level}. Weather Risk: {weather_impact} "
            f"Recommended Management: {recommendations[0] if recommendations else 'Monitor foliage.'}"
        )

        return {
            "crop_type": crop_type,
            "disease_name": disease_name,
            "confidence_score": confidence_score,
            "disease_status": "Disease Detected" if predicted_class != "healthy_crop" else "Healthy",
            "risk_level": risk_level,
            "symptoms": symptoms,
            "management_recommendations": recommendations,
            "location": location,
            "weather_impact": weather_impact,
            "final_advisory": final_advisory,
            "model_metadata": {
                "model_architecture": "MobileNetV2 (PyTorch)",
                "predicted_class": predicted_class,
                "all_probabilities": model_res.get("all_probabilities", {})
            }
        }


dataset_disease_service = DatasetCropDiseaseService()
