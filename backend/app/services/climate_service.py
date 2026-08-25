import logging
import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Regional Agricultural Climate Profiles (Ground Truth Dataset derived for Indian Agro-Climatic Zones)
REGIONAL_CLIMATE_DATABASE = {
    "andhra pradesh": {
        "kakinada": {
            "zone_name": "East Coast Plains & Hills Agro-Climatic Zone",
            "annual_rainfall_mm": 1150,
            "monsoon_type": "South-West & North-East Monsoon (Bimodal)",
            "temp_range": "22°C – 38°C",
            "humidity_pattern": "High humidity (65% – 85%) year-round due to coastal proximity",
            "typical_soil": "Deltaic Alluvial & Coastal Clay Loam",
            "seasonal_context": {
                "kharif": "High rainfall & humidity suitable for Paddy, Sugarcane, and Blackgram",
                "rabi": "Mild temperatures suitable for Maize, Pulses, and Paddy",
                "summer": "High heat stress; requires drip irrigation for Sesame and Vegetables"
            },
            "climate_risks": ["Coastal Depression / Cyclonic Rainfall", "High Moisture Fungal Disease Ingress"],
            "suitable_crops": ["Paddy", "Maize", "Sugarcane", "Banana", "Blackgram", "Cotton"]
        },
        "guntur": {
            "zone_name": "Southern Plateau & Hills / Krishna Delta Zone",
            "annual_rainfall_mm": 890,
            "monsoon_type": "South-West Monsoon Predominant",
            "temp_range": "20°C – 41°C",
            "humidity_pattern": "Moderate to High (50% – 78%)",
            "typical_soil": "Deep Black Cotton Soil",
            "seasonal_context": {
                "kharif": "Ideal for Chilli, Cotton, and Paddy",
                "rabi": "Favorable for Maize, Tobacco, and Pulses",
                "summer": "Hot & dry; water conservation essential"
            },
            "climate_risks": ["Mid-Season Drought Spells", "Thrips & Whitefly Outbreak in High Heat"],
            "suitable_crops": ["Chilli", "Cotton", "Paddy", "Maize", "Tobacco"]
        },
        "default": {
            "zone_name": "Andhra Pradesh Agro-Climatic Zone",
            "annual_rainfall_mm": 950,
            "monsoon_type": "South-West & North-East Monsoons",
            "temp_range": "21°C – 39°C",
            "humidity_pattern": "Moderate to High (55% – 80%)",
            "typical_soil": "Red Loamy & Black Soil",
            "seasonal_context": {
                "kharif": "Paddy, Cotton, and Groundnut",
                "rabi": "Maize and Pulses",
                "summer": "Short-duration Pulses & Oilseeds"
            },
            "climate_risks": ["Variable Monsoon Rainfall", "Heat Stress during Sowing"],
            "suitable_crops": ["Paddy", "Groundnut", "Cotton", "Maize"]
        }
    },
    "tamil nadu": {
        "chennai": {
            "zone_name": "North Eastern Agro-Climatic Zone of Tamil Nadu",
            "annual_rainfall_mm": 1200,
            "monsoon_type": "North-East Monsoon (Oct – Dec Peak Rainfall)",
            "temp_range": "24°C – 37°C",
            "humidity_pattern": "High Relative Humidity (70% – 88%)",
            "typical_soil": "Coastal Alluvium & Red Loam",
            "seasonal_context": {
                "kharif": "Moderate rainfall; Paddy (Sornavari) and Pulses",
                "rabi": "Heavy North-East Monsoon rainfall; Paddy (Samba) and Millets",
                "summer": "Hot & humid; Vegetables and Flowers"
            },
            "climate_risks": ["Heavy North-East Monsoon Inundation", "High Relative Humidity Blast Risk"],
            "suitable_crops": ["Paddy (Rice)", "Groundnut", "Sugarcane", "Pulses", "Vegetables"]
        },
        "coimbatore": {
            "zone_name": "Western Agro-Climatic Zone of Tamil Nadu",
            "annual_rainfall_mm": 720,
            "monsoon_type": "Bimodal Rainfall with Palghat Gap Influence",
            "temp_range": "19°C – 35°C",
            "humidity_pattern": "Moderate Humidity (50% – 75%)",
            "typical_soil": "Red Loam & Deep Black Soil",
            "seasonal_context": {
                "kharif": "Cotton, Sorghum, and Maize",
                "rabi": "Pulses, Oilseeds, and Millets",
                "summer": "Irrigated Cotton & Vegetables"
            },
            "climate_risks": ["Rain-Shadow Moisture Stress", "Wind Velocity Ingress"],
            "suitable_crops": ["Cotton", "Sorghum (Jowar)", "Maize", "Groundnut", "Sugarcane"]
        },
        "default": {
            "zone_name": "Tamil Nadu Agricultural Zone",
            "annual_rainfall_mm": 920,
            "monsoon_type": "North-East Monsoon Dominant",
            "temp_range": "22°C – 36°C",
            "humidity_pattern": "Moderate to High (60% – 82%)",
            "typical_soil": "Red Sandy & Coastal Alluvial",
            "seasonal_context": {
                "kharif": "Paddy, Millets, and Oilseeds",
                "rabi": "Samba Paddy and Pulses",
                "summer": "Cotton and Irrigated Crops"
            },
            "climate_risks": ["Delayed Monsoon Onset", "High Humidity Pest Vulnerability"],
            "suitable_crops": ["Paddy", "Sugarcane", "Groundnut", "Cotton", "Millets"]
        }
    },
    "telangana": {
        "hyderabad": {
            "zone_name": "Southern Telangana Agro-Climatic Zone",
            "annual_rainfall_mm": 810,
            "monsoon_type": "South-West Monsoon (June – Sept)",
            "temp_range": "18°C – 42°C",
            "humidity_pattern": "Low to Moderate (40% – 70%)",
            "typical_soil": "Red Chalkas & Black Soil",
            "seasonal_context": {
                "kharif": "Cotton, Maize, and Redgram",
                "rabi": "Bengalgram, Paddy, and Vegetables",
                "summer": "High Temperature; Drip Vegetables"
            },
            "climate_risks": ["High Summer Heat Waves", "Dry Dry-Spells in July"],
            "suitable_crops": ["Cotton", "Maize", "Redgram (Pigeon Pea)", "Soybean", "Paddy"]
        },
        "default": {
            "zone_name": "Telangana Agricultural Zone",
            "annual_rainfall_mm": 850,
            "monsoon_type": "South-West Monsoon Dominant",
            "temp_range": "19°C – 41°C",
            "humidity_pattern": "Moderate (45% – 72%)",
            "typical_soil": "Red & Black Cotton Soil",
            "seasonal_context": {
                "kharif": "Cotton, Maize, Paddy",
                "rabi": "Pulses & Oilseeds",
                "summer": "Vegetables & Fodder"
            },
            "climate_risks": ["Dry Spells", "Heat Stress"],
            "suitable_crops": ["Cotton", "Maize", "Paddy", "Redgram"]
        }
    },
    "karnataka": {
        "default": {
            "zone_name": "Karnataka Agro-Climatic Zone",
            "annual_rainfall_mm": 880,
            "monsoon_type": "South-West Monsoon",
            "temp_range": "18°C – 36°C",
            "humidity_pattern": "Moderate (50% – 75%)",
            "typical_soil": "Red Sandy Loam & Laterite",
            "seasonal_context": {
                "kharif": "Ragi, Maize, Sugarcane",
                "rabi": "Groundnut & Pulses",
                "summer": "Irrigated Crops"
            },
            "climate_risks": ["Moisture Stress in Semi-Arid Belts"],
            "suitable_crops": ["Ragi (Finger Millet)", "Maize", "Sugarcane", "Sunflower"]
        }
    }
}


class ClimateService:
    def determine_current_season(self) -> str:
        """Returns current Indian agricultural season based on month."""
        month = datetime.datetime.now().month
        if 6 <= month <= 10:
            return "Kharif Season (Monsoon Sowing)"
        elif 11 <= month or month <= 3:
            return "Rabi Season (Winter Sowing)"
        else:
            return "Summer / Zaid Season"

    def get_climate_analysis(self, state: str, district: str) -> Dict[str, Any]:
        """
        Retrieves long-term regional climate characteristics and seasonal agricultural
        context for the specified state and district.
        """
        state_clean = state.lower().strip() if state else "andhra pradesh"
        district_clean = district.lower().strip() if district else "kakinada"

        current_season = self.determine_current_season()

        if state_clean not in REGIONAL_CLIMATE_DATABASE:
            return {
                "available": False,
                "location_query": f"{district}, {state}",
                "message": f"Detailed regional climate baseline data is currently unavailable for {state}. Using general agricultural climate guidelines.",
                "current_season": current_season,
                "annual_rainfall_mm": None,
                "climate_risks": ["General Weather Variation"],
                "suitable_crops": ["Paddy", "Wheat", "Maize", "Pulses"]
            }

        state_data = REGIONAL_CLIMATE_DATABASE[state_clean]
        climate_info = state_data.get(district_clean, state_data.get("default"))

        season_key = "kharif" if "Kharif" in current_season else ("rabi" if "Rabi" in current_season else "summer")
        season_detail = climate_info["seasonal_context"].get(season_key, climate_info["seasonal_context"]["kharif"])

        return {
            "available": True,
            "location_query": f"{district.title()}, {state.title()}",
            "zone_name": climate_info["zone_name"],
            "annual_rainfall_mm": climate_info["annual_rainfall_mm"],
            "monsoon_type": climate_info["monsoon_type"],
            "temp_range": climate_info["temp_range"],
            "humidity_pattern": climate_info["humidity_pattern"],
            "typical_soil": climate_info["typical_soil"],
            "current_season": current_season,
            "seasonal_agricultural_context": season_detail,
            "climate_risks": climate_info["climate_risks"],
            "suitable_crops": climate_info["suitable_crops"]
        }


climate_service = ClimateService()
