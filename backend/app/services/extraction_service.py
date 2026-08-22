import re
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

KNOWN_CROPS = [
    "rice", "wheat", "maize", "corn", "cotton", "sugarcane", "tomato", "potato",
    "onion", "chilli", "soybean", "groundnut", "mustard", "pulses", "chickpea",
    "turmeric", "banana", "mango", "citrus", "apple", "tea", "coffee", "paddy"
]

KNOWN_DISEASES = [
    "blast", "blight", "rust", "powdery mildew", "downy mildew", "leaf spot",
    "wilt", "rot", "canker", "mosaic virus", "root rot", "anthracnose",
    "bacterial leaf streak", "yellow vein mosaic", "sheath blight", "stem rot"
]

DEFICIENCY_KEYWORDS = [
    "nitrogen deficiency", "phosphorus deficiency", "potassium deficiency",
    "zinc deficiency", "iron deficiency", "calcium deficiency", "magnesium deficiency",
    "boron deficiency", "sulfur deficiency", "chlorosis", "yellowing of leaves",
    "stunted growth", "leaf necrosis", "interveinal chlorosis", "purple leaves"
]


class ExtractionService:
    def extract_ph(self, text: str) -> Dict[str, Any]:
        """Extracts soil pH value with confidence score."""
        match = re.search(r'\bph\b\s*(?:level|value|index)?\s*[:=–-]?\s*(\d+(?:\.\d+)?)\b', text, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                if 3.0 <= val <= 10.5:
                    return {"value": val, "unit": None, "confidence": 0.95}
            except ValueError:
                pass
        
        match_alt = re.search(r'\b(\d+\.\d+)\s*ph\b', text, re.IGNORECASE)
        if match_alt:
            try:
                val = float(match_alt.group(1))
                if 3.0 <= val <= 10.5:
                    return {"value": val, "unit": None, "confidence": 0.90}
            except ValueError:
                pass
                
        return {"value": None, "unit": None, "confidence": 0.0}

    def extract_npk(self, text: str) -> Dict[str, Dict[str, Any]]:
        """Extracts Nitrogen (N), Phosphorus (P), and Potassium (K) values with units and confidence."""
        res = {
            "nitrogen": {"value": None, "unit": "kg/ha", "confidence": 0.0},
            "phosphorus": {"value": None, "unit": "kg/ha", "confidence": 0.0},
            "potassium": {"value": None, "unit": "kg/ha", "confidence": 0.0}
        }

        # 1. Combined NPK notation: e.g. "NPK: 120-60-40" or "N:P:K = 140:40:50"
        combined_match = re.search(r'\b(?:npk|n:p:k|n-p-k)\b\s*[:=–-]?\s*(\d+(?:\.\d+)?)\s*[:/-]\s*(\d+(?:\.\d+)?)\s*[:/-]\s*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
        if combined_match:
            try:
                res["nitrogen"] = {"value": float(combined_match.group(1)), "unit": "kg/ha", "confidence": 0.95}
                res["phosphorus"] = {"value": float(combined_match.group(2)), "unit": "kg/ha", "confidence": 0.95}
                res["potassium"] = {"value": float(combined_match.group(3)), "unit": "kg/ha", "confidence": 0.95}
                return res
            except ValueError:
                pass

        # 2. Nitrogen (N)
        n_match = re.search(r'\b(?:nitrogen|avail(?:able)?\s*n)\b\s*(?:\([a-z0-9]+\))?\s*[:=–-]?\s*(\d+(?:\.\d+)?)\s*(kg/ha|ppm|mg/kg|%)?', text, re.IGNORECASE)
        if n_match:
            try:
                val = float(n_match.group(1))
                unit = n_match.group(2) or "kg/ha"
                res["nitrogen"] = {"value": val, "unit": unit, "confidence": 0.90}
            except ValueError:
                pass
        else:
            n_alt = re.search(r'\b(?:n)\b\s*[:=–-]\s*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
            if n_alt:
                try:
                    res["nitrogen"] = {"value": float(n_alt.group(1)), "unit": "kg/ha", "confidence": 0.80}
                except ValueError:
                    pass

        # 3. Phosphorus (P)
        p_match = re.search(r'\b(?:phosphorus|phosphate|avail(?:able)?\s*p|p2o5)\b\s*(?:\([a-z0-9]+\))?\s*[:=–-]?\s*(\d+(?:\.\d+)?)\s*(kg/ha|ppm|mg/kg|%)?', text, re.IGNORECASE)
        if p_match:
            try:
                val = float(p_match.group(1))
                unit = p_match.group(2) or "kg/ha"
                res["phosphorus"] = {"value": val, "unit": unit, "confidence": 0.90}
            except ValueError:
                pass
        else:
            p_alt = re.search(r'\b(?:p)\b\s*[:=–-]\s*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
            if p_alt:
                try:
                    res["phosphorus"] = {"value": float(p_alt.group(1)), "unit": "kg/ha", "confidence": 0.80}
                except ValueError:
                    pass

        # 4. Potassium (K)
        k_match = re.search(r'\b(?:potassium|potash|avail(?:able)?\s*k|k2o)\b\s*(?:\([a-z0-9]+\))?\s*[:=–-]?\s*(\d+(?:\.\d+)?)\s*(kg/ha|ppm|mg/kg|%)?', text, re.IGNORECASE)
        if k_match:
            try:
                val = float(k_match.group(1))
                unit = k_match.group(2) or "kg/ha"
                res["potassium"] = {"value": val, "unit": unit, "confidence": 0.90}
            except ValueError:
                pass
        else:
            k_alt = re.search(r'\b(?:k)\b\s*[:=–-]\s*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
            if k_alt:
                try:
                    res["potassium"] = {"value": float(k_alt.group(1)), "unit": "kg/ha", "confidence": 0.80}
                except ValueError:
                    pass

        return res

    def extract_organic_carbon(self, text: str) -> Dict[str, Any]:
        """Extracts Organic Carbon (OC) %."""
        match = re.search(r'\b(?:organic\s*carbon|oc)\b\s*(?:\([a-z0-9]+\))?\s*[:=–-]?\s*(\d+(?:\.\d+)?)\s*(%)?', text, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                if val <= 5.0:
                    return {"value": val, "unit": "%", "confidence": 0.88}
            except ValueError:
                pass
        return {"value": None, "unit": "%", "confidence": 0.0}

    def extract_electrical_conductivity(self, text: str) -> Dict[str, Any]:
        """Extracts Electrical Conductivity (EC) dS/m."""
        match = re.search(r'\b(?:electrical\s*conductivity|ec)\b\s*(?:\([a-z0-9]+\))?\s*[:=–-]?\s*(\d+(?:\.\d+)?)\s*(ds/m|mmhos/cm)?', text, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                unit = match.group(2) or "dS/m"
                return {"value": val, "unit": unit, "confidence": 0.85}
            except ValueError:
                pass
        return {"value": None, "unit": "dS/m", "confidence": 0.0}

    def extract_soil_type(self, text: str) -> str:
        """Identifies soil texture type."""
        text_lower = text.lower()
        if "clay loam" in text_lower:
            return "Clay Loam"
        elif "sandy loam" in text_lower:
            return "Sandy Loam"
        elif "black cotton" in text_lower or "black soil" in text_lower:
            return "Black Cotton Soil"
        elif "alluvial" in text_lower:
            return "Alluvial Soil"
        elif "red soil" in text_lower:
            return "Red Soil"
        elif "laterite" in text_lower:
            return "Laterite Soil"
        elif "clay" in text_lower:
            return "Clayey Soil"
        elif "sandy" in text_lower:
            return "Sandy Soil"
        return "Loamy Soil"

    def extract_crops(self, text: str) -> List[str]:
        found_crops = set()
        text_lower = text.lower()
        for crop in KNOWN_CROPS:
            if re.search(r'\b' + re.escape(crop) + r'\b', text_lower):
                found_crops.add(crop.capitalize())
        return list(found_crops)

    def extract_diseases(self, text: str) -> List[str]:
        found_diseases = set()
        text_lower = text.lower()
        for disease in KNOWN_DISEASES:
            if disease in text_lower:
                found_diseases.add(disease.title())
        return list(found_diseases)

    def extract_deficiencies(self, text: str, npk_data: Dict[str, Any], ph_val: Optional[float]) -> List[str]:
        deficiencies = set()
        text_lower = text.lower()

        for kw in DEFICIENCY_KEYWORDS:
            if kw in text_lower:
                deficiencies.add(kw.title())

        n_val = npk_data["nitrogen"]["value"]
        p_val = npk_data["phosphorus"]["value"]
        k_val = npk_data["potassium"]["value"]

        if n_val is not None and n_val < 140:
            deficiencies.add("Low Nitrogen (N Deficiency)")
        if p_val is not None and p_val < 15:
            deficiencies.add("Low Phosphorus (P Deficiency)")
        if k_val is not None and k_val < 120:
            deficiencies.add("Low Potassium (K Deficiency)")

        if ph_val is not None:
            if ph_val < 6.0:
                deficiencies.add("Acidic Soil (Micronutrient Risk)")
            elif ph_val > 7.8:
                deficiencies.add("Alkaline Soil (Zinc & Iron Lockout Risk)")

        return list(deficiencies)

    def generate_report_summary(self, ph: Optional[float], npk: Dict[str, Any], soil_type: str) -> str:
        """Generates a data-driven report summary."""
        parts = []

        if ph is not None:
            if ph < 6.0:
                parts.append(f"Your soil report shows acidic soil (pH {ph}).")
            elif 6.0 <= ph <= 7.5:
                parts.append(f"Your soil report shows optimal neutral soil (pH {ph}).")
            else:
                parts.append(f"Your soil report shows alkaline soil (pH {ph}).")
        else:
            parts.append("Soil pH level was not explicitly stated in the report.")

        n_val = npk["nitrogen"]["value"]
        if n_val is not None:
            status = "low" if n_val < 140 else ("optimal" if n_val <= 280 else "high")
            parts.append(f"Nitrogen level is {status} ({n_val} kg/ha).")
        else:
            parts.append("Nitrogen level could not be extracted.")

        p_val = npk["phosphorus"]["value"]
        if p_val is not None:
            status = "low" if p_val < 15 else ("optimal" if p_val <= 50 else "high")
            parts.append(f"Phosphorus is {status} ({p_val} kg/ha).")

        k_val = npk["potassium"]["value"]
        if k_val is not None:
            status = "low" if k_val < 120 else ("optimal" if k_val <= 280 else "high")
            parts.append(f"Potassium is {status} ({k_val} kg/ha).")

        parts.append(f"Soil texture classified as {soil_type}.")
        return " ".join(parts)

    def extract_all(self, text: str) -> Dict[str, Any]:
        """Runs full agricultural information extraction pipeline."""
        ph_data = self.extract_ph(text)
        npk_data = self.extract_npk(text)
        oc_data = self.extract_organic_carbon(text)
        ec_data = self.extract_electrical_conductivity(text)
        soil_type = self.extract_soil_type(text)

        crops = self.extract_crops(text)
        diseases = self.extract_diseases(text)
        deficiencies = self.extract_deficiencies(text, npk_data, ph_data["value"])
        summary = self.generate_report_summary(ph_data["value"], npk_data, soil_type)

        return {
            "ph": ph_data,
            "nitrogen": npk_data["nitrogen"],
            "phosphorus": npk_data["phosphorus"],
            "potassium": npk_data["potassium"],
            "organic_carbon": oc_data,
            "electrical_conductivity": ec_data,
            "soil_type": soil_type,
            "crops_detected": crops,
            "diseases_detected": diseases,
            "nutrient_deficiencies": deficiencies,
            "summary": summary
        }


extraction_service = ExtractionService()
