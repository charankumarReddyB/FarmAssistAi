import logging
from typing import Dict, Any, Optional
from app.services.weather_service import weather_service
from app.services.climate_service import climate_service
from app.services.dataset_regional_soil_service import dataset_regional_soil_service
from app.services.crop_suitability_service import crop_suitability_service
from app.services.dataset_fertilizer_service import dataset_fertilizer_service

logger = logging.getLogger(__name__)

# Translation Dictionary for Location-Based Farm Analysis
LOCATION_ANALYSIS_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "te": {
        "weather_impact_rain": "వర్షం పడే అవకాశం ఉంది. నీటిపారుదలని తాత్కాలికంగా వాయిదా వేయండి.",
        "weather_impact_heat": "అధిక ఉష్ణోగ్రత హెచ్చరిక. మట్టిలో తేమ స్థాయిలను క్రమం తప్పకుండా పర్యవేక్షించండి.",
        "weather_impact_normal": "ప్రస్తుత వాతావరణం ప్రామాణిక వ్యవసాయ పనులకు అనుకూలంగా ఉంది.",
        "soil_comp_low_n": "మీ నత్రజని (నైట్రోజన్) స్థాయి ఈ ప్రాంతీయ సగటు కంటే తక్కువగా ఉంది.",
        "soil_comp_normal": "మీ మట్టి పోషకాల స్థాయిలు ప్రాంతీయ సగటుకు అనుగుణంగా ఉన్నాయి.",
        "irrigation_advice_rain": "రాబోయే 24 గంటల్లో వర్షం కురిసే అవకాశం ఉన్నందున నీటిపారుదలని నిలిపివేయండి.",
        "irrigation_advice_normal": "పంట పెరుగుదల దశకు అనుగుణంగా క్రమబద్ధమైన నీటిపారుదలని కొనసాగించండి.",
        "next_action_default": "ఫెర్టిలైజర్ సిఫార్సు ప్రకారం యూరియా మరియు DAP వేయండి. పొలంలో డ్రైనేజీ వసతిని తనిఖీ చేయండి."
    },
    "ta": {
        "weather_impact_rain": "மழை வாய்ப்பு உள்ளது. திட்டமிட்ட நீர்ப்பாசனத்தை தள்ளிப்போடுங்கள்.",
        "weather_impact_heat": "அதிக வெப்பநிலை எச்சரிக்கை. மண்ணின் ஈரப்பதத்தை தொடர்ந்து கண்காணிக்கவும்.",
        "weather_impact_normal": "தற்போதைய வானிலை வழக்கமான விவசாயப் பணிகளுக்கு சாதகமாக உள்ளது.",
        "soil_comp_low_n": "உங்கள் நைட்ரஜன் அளவு இந்த பிராந்திய சராசரியை விட குறைவாக உள்ளது.",
        "soil_comp_normal": "உங்கள் மண் சத்துக்கள் பிராந்திய சராசரிக்கு ஏற்ப உள்ளன.",
        "irrigation_advice_rain": "அடுத்த 24 மணிநேரத்தில் மழை எதிர்பார்க்கப்படுவதால் நீர்ப்பாசனத்தை நிறுத்தவும்.",
        "irrigation_advice_normal": "பயிர் வளர்ச்சி நிலைக்கு ஏற்ப வழக்கமான நீர்ப்பாசனத்தை தொடரவும்.",
        "next_action_default": "உரப் பரிந்துரையின்படி யூரியா மற்றும் DAP இடவும். வயல் வடிகால் வசதியை சரிபார்க்கவும்."
    },
    "hi": {
        "weather_impact_rain": "बारिश की संभावना है। सिंचाई स्थगित करने पर विचार करें।",
        "weather_impact_heat": "उच्च तापमान की चेतावनी। मिट्टी की नमी की निगरानी करें।",
        "weather_impact_normal": "वर्तमान मौसम सामान्य कृषि कार्यों के लिए अनुकूल है।",
        "soil_comp_low_n": "आपका नाइट्रोजन स्तर क्षेत्रीय औसत से कम है।",
        "soil_comp_normal": "आपके मिट्टी के पोषक तत्व क्षेत्रीय औसत के अनुरूप हैं।",
        "irrigation_advice_rain": "अगले 24 घंटों में बारिश की संभावना के कारण सिंचाई रोकें।",
        "irrigation_advice_normal": "फसल वृद्धि चरण के अनुसार नियमित सिंचाई जारी रखें।",
        "next_action_default": "उर्वरक सिफारिश के अनुसार यूरिया और डीएपी का प्रयोग करें। खेत में जल निकासी की जाँच करें।"
    }
}


class UnifiedFarmAnalysisService:
    def analyze_farm(
        self,
        location: str = "Kakinada, Andhra Pradesh",
        state: str = "Andhra Pradesh",
        district: str = "Kakinada",
        city_town: str = "Kakinada",
        village: str = "Samalkota",
        latitude: Optional[float] = 16.98,
        longitude: Optional[float] = 82.24,
        report_n: Optional[float] = 120.0,
        report_p: Optional[float] = 14.0,
        report_k: Optional[float] = 110.0,
        report_ph: Optional[float] = 6.5,
        detected_disease: Optional[str] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Synthesizes Location + Live Weather + Climate Context + Soil Report + 4 Kaggle Datasets
        into a comprehensive, location-personalized agricultural analysis.
        """
        lang = language.lower().strip() if language else "en"

        # 1. Fetch Live Weather Data from Open-Meteo
        weather = weather_service.get_weather(location=location, lat=latitude, lon=longitude)
        temp = weather.get("temperature", 31.0)
        humidity = weather.get("humidity", 72)
        rain_prob = weather.get("rain_probability", 15)

        # 2. Fetch Long-Term Regional Climate Analysis
        climate = climate_service.get_climate_analysis(state=state, district=district)
        current_season = climate.get("current_season", "Kharif Season")

        # 3. Regional Soil Baseline Comparison
        soil_analysis = dataset_regional_soil_service.analyze_regional_soil(
            state=state, district=district,
            report_n=report_n, report_p=report_p, report_k=report_k, report_ph=report_ph
        )

        # 4. Location-Aware Crop Suitability (Dataset 1 + Environmental Context)
        n_val = report_n if report_n is not None else 120.0
        p_val = report_p if report_p is not None else 14.0
        k_val = report_k if report_k is not None else 110.0
        ph_val = report_ph if report_ph is not None else 6.5

        crop_suitability = crop_suitability_service.evaluate_crop_suitability(
            n=n_val, p=p_val, k=k_val, ph=ph_val,
            temperature=temp, humidity=humidity, rainfall=float(rain_prob * 3),
            state=state, district=district, current_season=current_season
        )

        # 5. Fertilizer Recommendation (Dataset 2)
        fert_recs = dataset_fertilizer_service.recommend_fertilizer(
            n=n_val, p=p_val, k=k_val,
            soil_type=soil_analysis.get("regional_soil_type", "Clay Loam"),
            crop_name=crop_suitability.get("recommended_crop", "Paddy")
        )
        fert_rec = fert_recs[0] if fert_recs else {"fertilizer": "Urea & DAP", "dosage": "50 kg/acre"}

        # 6. Synthesize Agricultural Insights & Weather Impact
        weather_impact_msg = weather.get("farm_impact")
        irrigation_advice = "Normal scheduled irrigation recommended."

        if rain_prob > 40:
            weather_impact_msg = "High rainfall probability expected in your area. Delay planned irrigation to prevent soil waterlogging."
            irrigation_advice = "Postpone planned irrigation today due to forecast precipitation."
            if lang in LOCATION_ANALYSIS_TRANSLATIONS:
                weather_impact_msg = LOCATION_ANALYSIS_TRANSLATIONS[lang]["weather_impact_rain"]
                irrigation_advice = LOCATION_ANALYSIS_TRANSLATIONS[lang]["irrigation_advice_rain"]
        elif temp > 35:
            weather_impact_msg = "High ambient temperature detected. Increased evapotranspiration risk; monitor soil moisture closely."
            irrigation_advice = "Apply light morning irrigation to protect crop root zone from heat stress."

        # 7. Disease Risk Context (Separating Model Diagnosis vs. Environmental Risk)
        env_disease_vulnerability = "Low"
        env_risk_note = "Current humidity and rainfall levels are within normal disease-resistant thresholds."
        if humidity > 78 or rain_prob > 50:
            env_disease_vulnerability = "HIGH"
            env_risk_note = "High relative humidity (>75%) and rainfall create favorable conditions for fungal leaf blast and sheath blight."
        elif temp > 36:
            env_disease_vulnerability = "MODERATE"
            env_risk_note = "High temperature increases heat-stress vulnerability and sap-sucking pest activity."

        disease_risk = {
            "model_diagnosis": detected_disease or "No disease detected on leaf image scan.",
            "environmental_vulnerability": env_disease_vulnerability,
            "environmental_risk_analysis": env_risk_note,
        }

        # 8. Overall Farm Risk Level
        farm_risk_level = "MODERATE"
        risk_reasons = []

        if n_val < 140:
            risk_reasons.append(f"Nitrogen level ({n_val} kg/ha) is below regional optimal baseline.")
        if rain_prob > 50:
            risk_reasons.append(f"High precipitation risk ({rain_prob}% probability).")
        if env_disease_vulnerability == "HIGH":
            risk_reasons.append("High humidity environmental fungal disease risk.")

        if len(risk_reasons) >= 2:
            farm_risk_level = "HIGH"
        elif len(risk_reasons) == 0:
            farm_risk_level = "LOW"

        # 9. Recommended Next Action
        recommended_action = (
            f"Apply recommended fertilizer ({fert_rec.get('recommended_fertilizer', 'Urea & DAP')}). "
            f"Ensure proper field drainage for {crop_suitability.get('recommended_crop', 'Paddy')}."
        )
        if lang in LOCATION_ANALYSIS_TRANSLATIONS:
            recommended_action = LOCATION_ANALYSIS_TRANSLATIONS[lang]["next_action_default"]

        return {
            "location": {
                "full_location": location,
                "state": state,
                "district": district,
                "city_town": city_town,
                "village": village,
                "latitude": latitude,
                "longitude": longitude,
            },
            "live_weather": {
                "temperature": temp,
                "humidity": humidity,
                "wind_speed": weather.get("wind_speed"),
                "rain_probability": rain_prob,
                "condition": weather.get("condition"),
            },
            "weather_impact": weather_impact_msg,
            "climate_context": climate,
            "soil_health_analysis": {
                "ph": ph_val,
                "nitrogen": n_val,
                "phosphorus": p_val,
                "potassium": k_val,
                "soil_type": soil_analysis.get("regional_soil_type"),
            },
            "regional_soil_analysis": soil_analysis,
            "crop_suitability": crop_suitability,
            "fertilizer_recommendation": fert_rec,
            "disease_risk": disease_risk,
            "irrigation_advice": irrigation_advice,
            "farm_risk": {
                "level": farm_risk_level,
                "risk_factors": risk_reasons if risk_reasons else ["All parameters within normal range."],
            },
            "recommended_action": recommended_action,
        }


farm_analysis_service = UnifiedFarmAnalysisService()
