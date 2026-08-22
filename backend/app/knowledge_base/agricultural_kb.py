import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

KB_JSON_PATH = os.path.join(os.path.dirname(__file__), "agricultural_kb.json")


def load_knowledge_base() -> List[Dict[str, Any]]:
    """Loads modular agricultural knowledge base entries from JSON file with fallback."""
    if os.path.exists(KB_JSON_PATH):
        try:
            with open(KB_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception as e:
            logger.error(f"Error reading agricultural_kb.json: {e}")

    # Fallback default knowledge base entries
    return [
        {
            "id": "kb_soil_acidic",
            "category": "soil_health",
            "condition": "Acidic Soil (pH < 6.0)",
            "description": "Soil pH is acidic. Acidic soils lead to reduced availability of phosphorus, calcium, and magnesium.",
            "fertilizer_recommendation": "Apply agricultural lime (calcium carbonate) or dolomite @ 2-4 tonnes/ha to raise pH.",
            "suitable_crops": ["Rice", "Tea", "Potato"],
            "irrigation_tip": "Maintain adequate soil moisture to prevent rapid pH fluctuations.",
            "risk_factors": ["High aluminum toxicity risk", "Phosphorus fixation"]
        },
        {
            "id": "kb_soil_neutral",
            "category": "soil_health",
            "condition": "Optimal Neutral Soil (pH 6.0 - 7.5)",
            "description": "Soil pH is in the optimal range for maximum nutrient availability.",
            "fertilizer_recommendation": "Apply balanced NPK fertilizers (e.g. 19:19:19).",
            "suitable_crops": ["Wheat", "Maize", "Cotton", "Sugarcane", "Tomato"],
            "irrigation_tip": "Follow recommended crop watering schedules.",
            "risk_factors": ["Low risk; maintain organic carbon levels"]
        },
        {
            "id": "kb_n_deficiency",
            "category": "nutrient_management",
            "condition": "Nitrogen Deficiency (Low N < 140 kg/ha)",
            "description": "Low nitrogen levels reduce leaf growth and crop productivity.",
            "fertilizer_recommendation": "Apply split doses of Urea (46% N) @ 50-100 kg/ha.",
            "suitable_crops": ["Maize", "Rice", "Wheat"],
            "irrigation_tip": "Irrigate immediately after top-dressing Urea.",
            "risk_factors": ["Severe yield drop", "Yellowing leaves"]
        }
    ]


AGRICULTURAL_KNOWLEDGE_BASE = load_knowledge_base()


def get_kb_as_texts() -> List[str]:
    """Returns list of text passages for Sentence-BERT embedding generation."""
    passages = []
    for item in AGRICULTURAL_KNOWLEDGE_BASE:
        text = f"{item['condition']}. {item['description']} Recommendations: {item['fertilizer_recommendation']}. Suitable crops: {', '.join(item['suitable_crops'])}."
        passages.append(text)
    return passages
