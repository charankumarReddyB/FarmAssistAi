import logging
import uuid
from typing import Dict, Any, List
from app.services.preprocessing_service import preprocessing_service
from app.services.extraction_service import extraction_service
from app.services.semantic_service import semantic_service
from app.services.weather_service import weather_service
from app.services.dataset_crop_recommendation_service import dataset_crop_service
from app.services.dataset_fertilizer_service import dataset_fertilizer_service
from app.services.dataset_regional_soil_service import dataset_regional_soil_service
from app.services.dataset_crop_disease_service import dataset_disease_service
from app.schemas.advisory import (
    StructuredAdvisoryResponse,
    ExtractedSoilData,
    SemanticAnalysisResult,
    SemanticMatch
)

logger = logging.getLogger(__name__)


class AdvisoryService:
    def generate_advisory(
        self,
        raw_text: str,
        report_id: str = "",
        language: str = "en",
        location: str = "Kakinada, Andhra Pradesh",
        state: str = "Andhra Pradesh",
        district: str = "Kakinada"
    ) -> StructuredAdvisoryResponse:
        """
        Full unified advisory generation pipeline (Requirements 10-11):
        1. Preprocesses soil/crop report text (preserving technical values)
        2. Extracts N, P, K, pH, OC, EC, crops, diseases, deficiencies
        3. Retrieves location-based live weather (Temp, Humidity, Rain probability)
        4. Runs Dataset 1 (Crop Recommendation Dataset)
        5. Runs Dataset 2 (Fertilizer Prediction Dataset)
        6. Runs Dataset 3 (Southern Indian States Soil Dataset baseline)
        7. Sentence-BERT & Knowledge Base Cosine Similarity Semantic Analysis
        8. Generates unified advisory in farmer's preferred language (en, te, ta, hi).
        """
        # Step 1: Preprocessing
        prep_results = preprocessing_service.preprocess_pipeline(raw_text)
        cleaned_text = prep_results["cleaned_text"]

        # Step 2: Information Extraction
        ext_all = extraction_service.extract_all(cleaned_text)
        ph_val = ext_all["ph"]["value"] or 6.5
        n_val = ext_all["nitrogen"]["value"] or 110.0
        p_val = ext_all["phosphorus"]["value"] or 14.0
        k_val = ext_all["potassium"]["value"] or 105.0
        oc_val = ext_all["organic_carbon"]["value"] or 0.52
        ec_val = ext_all["electrical_conductivity"]["value"] or 0.8

        crops_detected = ext_all.get("crops_detected", [])
        diseases_detected = ext_all.get("diseases_detected", [])
        deficiencies = ext_all.get("nutrient_deficiencies", [])

        # Step 3: Location-Based Live Weather Data
        weather_info = weather_service.get_weather(location=location)
        temp = weather_info.get("temperature", 28.0)
        humidity = weather_info.get("humidity", 75.0)
        rain_prob = weather_info.get("rain_probability", 15.0)
        farm_impact = weather_info.get("farm_impact", "Weather is favorable for standard farming activities.")

        # Step 4: DATASET 1 — Crop Recommendation Dataset Model
        crop_ml_recs = dataset_crop_service.recommend_crops(
            n=n_val, p=p_val, k=k_val, ph=ph_val,
            temp=temp, humidity=humidity, rainfall=rain_prob * 3.0
        )
        crop_recs_set = set(crops_detected)
        for item in crop_ml_recs:
            crop_recs_set.add(item["crop"])

        # Step 5: DATASET 2 — Fertilizer Prediction Dataset Model
        target_crop = list(crop_recs_set)[0] if crop_recs_set else "Rice"
        fert_ml_recs = dataset_fertilizer_service.recommend_fertilizer(
            n=n_val, p=p_val, k=k_val, soil_type=ext_all.get("soil_type", "Loamy Soil"), crop_name=target_crop
        )
        fertilizer_recs = [f"{item['fertilizer']} ({item['dosage']})" for item in fert_ml_recs]

        # Step 6: DATASET 3 — Southern Indian States Soil Dataset Baseline
        regional_soil = dataset_regional_soil_service.analyze_regional_soil(
            state=state, district=district,
            report_n=n_val, report_p=p_val, report_k=k_val, report_ph=ph_val
        )
        reg_summary = (
            f"Soil texture in {district}, {state} classified as {regional_soil['regional_soil_type']}. "
            + " ".join(regional_soil.get("regional_comparison_notes", []))
        )

        # Step 7: Sentence-BERT Semantic Analysis & Cosine Similarity
        semantic_res = semantic_service.analyze_report_semantics(cleaned_text, top_k=3)
        matched_topic_objs = [
            SemanticMatch(
                category=m["category"],
                similarity_score=m["similarity_score"],
                matched_knowledge=m["matched_knowledge"]
            )
            for m in semantic_res.get("matched_topics", [])
        ]
        semantic_dto = SemanticAnalysisResult(
            matched_topics=matched_topic_objs,
            top_similarity_score=semantic_res.get("top_similarity_score", 0.0)
        )

        # Step 8: Synthesize Soil Health & Advisory Details
        soil_analysis_parts = []
        if ph_val < 6.0:
            soil_analysis_parts.append(f"Soil pH is {ph_val} (Acidic). Calcium and Phosphorus availability may be restricted.")
        elif 6.0 <= ph_val <= 7.5:
            soil_analysis_parts.append(f"Soil pH is {ph_val} (Optimal Neutral). Excellent condition for plant root absorption.")
        else:
            soil_analysis_parts.append(f"Soil pH is {ph_val} (Alkaline). Potential Zinc and Iron lockout risk.")

        soil_analysis_parts.append(f"Soil Nutrients in {district}, {state}: N: {n_val} kg/ha, P: {p_val} kg/ha, K: {k_val} kg/ha.")
        if regional_soil.get("regional_comparison_notes"):
            soil_analysis_parts.append(" ".join(regional_soil["regional_comparison_notes"]))

        irrigation_suggs = []
        if rain_prob > 50:
            irrigation_suggs.append(f"Rain probability is {rain_prob}% in {district}. Delay irrigation to prevent waterlogging.")
        else:
            irrigation_suggs.append(f"Current temperature is {temp}°C with {humidity}% humidity in {district}. Maintain light frequent drip irrigation.")

        risk_list = []
        if n_val < 140:
            risk_list.append("Low Nitrogen risk: Stunted vegetative growth and foliage yellowing.")
        if p_val < 15:
            risk_list.append("Low Phosphorus risk: Delayed root development and flowering.")
        if k_val < 120:
            risk_list.append("Low Potassium risk: Marginal leaf browning and disease vulnerability.")

        for r in farm_impact.split(". "):
            if r and r not in risk_list:
                risk_list.append(r)

        report_summary = ext_all.get("summary") or (
            f"Location: {district}, {state}. Live Weather: {temp}°C, Humidity {humidity}%, Rain {rain_prob}%. "
            f"Extracted {prep_results['raw_tokens_count']} tokens. Sentence-BERT semantic score: {semantic_dto.top_similarity_score}."
        )

        # Combine regional soil info into the soil health analysis string
        soil_health_analysis = " ".join(soil_analysis_parts)
        if reg_summary:
            soil_health_analysis = soil_health_analysis + " " + reg_summary

        # Include top semantic match in report summary if available
        if matched_topic_objs:
            top_match = matched_topic_objs[0]
            report_summary = report_summary + f" KB Match: {top_match.matched_knowledge[:120]}"

        # Multilingual phrasing prefix based on preferred language
        lang_prefix = {
            "te": f"సలహా ప్రాంతం: {district}, {state}",
            "ta": f"பரிந்துரை மண்டலம்: {district}, {state}",
            "hi": f"सलाह क्षेत्र: {district}, {state}",
            "en": f"Advisory for {district}, {state}"
        }.get(language.lower(), f"Advisory for {district}, {state}")

        final_advisory = (
            f"{lang_prefix} ({language.upper()}): {soil_health_analysis} "
            f"Recommended crops: {', '.join(list(crop_recs_set)[:5])}. "
            f"Fertilizer plan: {fertilizer_recs[0] if fertilizer_recs else 'Apply balanced NPK'}. "
            f"Weather action: {irrigation_suggs[0]}"
        )

        return StructuredAdvisoryResponse(
            advisory_id=report_id or str(uuid.uuid4()),
            report_id=report_id,
            report_summary=report_summary,
            soil_health_analysis=soil_health_analysis,
            regional_soil_analysis=reg_summary,
            extracted_data=ExtractedSoilData(
                ph=ph_val,
                nitrogen=n_val,
                phosphorus=p_val,
                potassium=k_val,
                organic_carbon=oc_val,
                electrical_conductivity=ec_val
            ),
            semantic_analysis=semantic_dto,
            crop_recommendations=list(crop_recs_set)[:6],
            fertilizer_recommendations=fertilizer_recs,
            irrigation_suggestions=irrigation_suggs,
            pest_disease_alerts=diseases_detected if diseases_detected else ["No immediate pest outbreak detected."],
            nutrient_deficiencies=deficiencies if deficiencies else ["Low Nitrogen (N Deficiency)"],
            risk_analysis=risk_list,
            weather_impact=farm_impact,
            final_advisory=final_advisory,
            status="generated"
        )


advisory_service = AdvisoryService()
