import React from 'react'
import { useApp } from '../App'
import { AiBadge } from './StatusBadge'

export interface FarmIntelligenceData {
  location?: {
    full_location?: string
    state?: string
    district?: string
    city_town?: string
    village?: string
    latitude?: number
    longitude?: number
  }
  live_weather?: {
    temperature?: number
    humidity?: number
    wind_speed?: number
    rain_probability?: number
    condition?: string
    source?: 'live_open_meteo' | 'location_baseline' | string
    status?: string
  }
  weather_impact?: string
  climate_context?: {
    zone_name?: string
    current_season?: string
    seasonal_agricultural_context?: string
    climate_risks?: string[]
    monsoon_type?: string
  }
  soil_health_analysis?: {
    has_soil_report?: boolean
    status_message?: string
    ph?: number
    nitrogen?: number
    phosphorus?: number
    potassium?: number
    soil_type?: string
  }
  regional_soil_analysis?: {
    dataset_covered?: boolean
    baseline_precision?: string
    regional_soil_type?: string
    regional_comparison_notes?: string[]
    message?: string
  }
  crop_suitability?: {
    recommended_crop?: string
    suitability_explanation?: string
  }
  disease_risk?: {
    has_crop_image?: boolean
    model_diagnosis?: string
    environmental_vulnerability?: string
    environmental_risk_analysis?: string
  }
  irrigation_advice?: string
  farm_risk?: {
    level?: 'LOW' | 'MODERATE' | 'HIGH' | 'INSUFFICIENT_DATA' | string
    message?: string
    risk_factors?: string[]
  }
  recommended_action?: string
  prioritized_actions?: Array<{
    priority: 'IMMEDIATE ACTION' | 'NEXT ACTION' | 'MONITOR' | string
    action: string
    category?: string
  }>
}

interface Props {
  data: FarmIntelligenceData | null
  loading?: boolean
}

export const FarmIntelligence: React.FC<Props> = ({ data, loading }) => {
  const { t } = useApp()

  if (loading) {
    return (
      <div className="bg-white border border-pebble rounded-2xl p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-mist rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 bg-mist rounded"></div>
          <div className="h-28 bg-mist rounded"></div>
          <div className="h-28 bg-mist rounded"></div>
          <div className="h-28 bg-mist rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const weatherSource = data.live_weather?.source || 'location_baseline'
  const isLiveWeather = weatherSource === 'live_open_meteo'

  // Data classification labels
  const srcLocation = t('src_location_profile')
  const srcWeather = isLiveWeather ? t('src_live_weather') : t('src_baseline_weather')
  const srcClimate = t('src_climate_kb')
  const srcSoil = t('src_soil_baseline')
  const srcCrop = t('src_crop_model')
  const srcDisease = data.disease_risk?.has_crop_image ? t('src_disease_model') : t('src_env_risk')
  const srcFarmRisk = t('src_farm_risk')
  const srcActions = t('src_actions_engine')

  // Overall Farm Risk
  const farmRiskLevel = data.farm_risk?.level || 'MODERATE'
  const isInsufficientRiskData = farmRiskLevel === 'INSUFFICIENT_DATA'

  // Regional Soil Dataset 3 coverage
  const isSoilCovered = data.regional_soil_analysis?.dataset_covered !== false

  // Prioritized actions
  const actionsList = data.prioritized_actions || [
    { priority: 'IMMEDIATE ACTION', action: data.recommended_action || 'Inspect fields and manage irrigation schedule.' },
    { priority: 'NEXT ACTION', action: 'Review latest soil nutrient levels.' },
    { priority: 'MONITOR', action: 'Monitor temperature and humidity levels.' }
  ]

  return (
    <div id="farm-intelligence-section" className="bg-white border border-pebble rounded-2xl p-6 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <h2 className="font-display text-2xl font-bold text-charcoal tracking-wide uppercase">
              {t('loc_farm_intelligence')}
            </h2>
          </div>
          <p className="text-xs text-sage font-mono mt-1">
            Location-Based Agricultural Analysis & Transparency Module
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AiBadge label="Real-time Location Sync" />
        </div>
      </div>

      {/* 9-Step Farmer-Facing Analysis Layout */}
      <div className="space-y-5">
        
        {/* Step 1: Farm Location */}
        <div className="p-4 bg-mist/50 border border-pebble/70 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span>📍</span> {t('loc_step_1_location')}
            </h3>
            <span className="text-[11px] font-mono text-sage bg-white px-2 py-0.5 rounded border border-pebble">
              {srcLocation}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-2">
            <div>
              <span className="text-sage block font-mono uppercase text-[10px]">District / Location</span>
              <span className="font-bold text-charcoal text-sm">{data.location?.district || data.location?.full_location}</span>
            </div>
            <div>
              <span className="text-sage block font-mono uppercase text-[10px]">State</span>
              <span className="font-bold text-charcoal text-sm">{data.location?.state}</span>
            </div>
            <div>
              <span className="text-sage block font-mono uppercase text-[10px]">Village / Town</span>
              <span className="font-semibold text-charcoal">{data.location?.village || data.location?.city_town || 'Local Region'}</span>
            </div>
            <div>
              <span className="text-sage block font-mono uppercase text-[10px]">GPS Coordinates</span>
              <span className="font-mono text-charcoal font-medium">
                {data.location?.latitude ? `${data.location.latitude}° N, ${data.location.longitude}° E` : 'District Center GPS'}
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Current Weather & Source Transparency */}
        <div className={`p-5 rounded-xl border space-y-3 transition-colors ${
          isLiveWeather ? 'bg-emerald-50/40 border-emerald-200' : 'bg-amber-50/40 border-amber-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pebble/40 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
                <span>🌦️</span> {t('loc_step_2_weather')}
              </h3>
              {/* Data Source Badge: LIVE WEATHER vs ESTIMATED REGIONAL BASELINE */}
              {isLiveWeather ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-600 text-white shadow-xs">
                  {t('badge_live_weather')}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-600 text-white shadow-xs">
                  {t('badge_estimated_baseline')}
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-sage block">
                {srcWeather}
              </span>
              <span className={`text-[11px] font-mono font-semibold ${isLiveWeather ? 'text-emerald-700' : 'text-amber-700'}`}>
                Status: {isLiveWeather ? t('status_live_api_active') : t('status_live_weather_unavailable')}
              </span>
            </div>
          </div>

          {!isLiveWeather && (
            <div className="p-2.5 bg-amber-100/70 border border-amber-300 text-amber-900 text-xs rounded-lg flex items-center gap-2 font-medium">
              <span>⚠️</span>
              <span>{t('status_using_regional_baseline')}</span>
            </div>
          )}

          {/* Weather Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-white/80 p-3 rounded-lg border border-pebble/50">
              <span className="text-sage text-[10px] font-mono uppercase block">{t('weather_feels_like')} / Temp</span>
              <span className="font-display text-2xl text-charcoal font-bold">{data.live_weather?.temperature}°C</span>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-pebble/50">
              <span className="text-sage text-[10px] font-mono uppercase block">{t('weather_humidity')}</span>
              <span className="font-display text-2xl text-charcoal font-bold">{data.live_weather?.humidity}%</span>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-pebble/50">
              <span className="text-sage text-[10px] font-mono uppercase block">{t('weather_wind')}</span>
              <span className="font-display text-2xl text-charcoal font-bold">{data.live_weather?.wind_speed} km/h</span>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-pebble/50">
              <span className="text-sage text-[10px] font-mono uppercase block">{t('weather_rain')} Risk</span>
              <span className="font-display text-2xl text-charcoal font-bold">{data.live_weather?.rain_probability}%</span>
            </div>
          </div>
        </div>

        {/* Step 3: Weather Impact */}
        <div className="p-4 bg-mist/50 border border-pebble/70 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span>◉</span> {t('loc_step_3_weather_impact')}
            </h3>
            <span className="text-[11px] font-mono text-sage bg-white px-2 py-0.5 rounded border border-pebble">
              {t('src_env_risk')}
            </span>
          </div>
          <p className="text-charcoal text-sm font-medium leading-relaxed">
            {data.weather_impact}
          </p>
          {data.irrigation_advice && (
            <div className="text-xs text-forest font-semibold bg-leaf/10 p-2.5 rounded-lg border border-leaf/20 flex items-center gap-2">
              <span>💧</span>
              <span>Irrigation Advice: {data.irrigation_advice}</span>
            </div>
          )}
        </div>

        {/* Step 4: Climate Context */}
        <div className="p-4 bg-mist/50 border border-pebble/70 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span>🌡️</span> {t('loc_step_4_climate')}
            </h3>
            <span className="text-[11px] font-mono text-sage bg-white px-2 py-0.5 rounded border border-pebble">
              {srcClimate}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-sage block font-mono uppercase text-[10px]">Agro-Climatic Zone</span>
              <span className="font-bold text-charcoal">{data.climate_context?.zone_name || 'East Coast Plains'}</span>
            </div>
            <div>
              <span className="text-sage block font-mono uppercase text-[10px]">Current Agricultural Season</span>
              <span className="font-bold text-leaf">{data.climate_context?.current_season}</span>
            </div>
          </div>
          <p className="text-charcoal/90 text-xs leading-relaxed mt-1">
            {data.climate_context?.seasonal_agricultural_context}
          </p>
          {data.climate_context?.climate_risks && data.climate_context.climate_risks.length > 0 && (
            <div className="text-xs text-risk font-medium bg-risk/10 p-2 rounded border border-risk/20">
              ⚠️ Seasonal Climate Risks: {data.climate_context.climate_risks.join(', ')}
            </div>
          )}
        </div>

        {/* Step 5: Regional Soil Context & Soil Report Status */}
        <div className="p-4 bg-mist/50 border border-pebble/70 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span>🌱</span> {t('loc_step_5_soil')}
            </h3>
            <span className="text-[11px] font-mono text-sage bg-white px-2 py-0.5 rounded border border-pebble">
              {srcSoil}
            </span>
          </div>

          {!isSoilCovered ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-semibold">
              ⚠️ {t('msg_uncovered_soil_baseline')}
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sage">Regional Soil Type: </span>
                  <span className="font-bold text-charcoal">{data.regional_soil_analysis?.regional_soil_type}</span>
                </div>
                <div className="text-sage font-mono text-[11px]">
                  Precision: {data.regional_soil_analysis?.baseline_precision}
                </div>
              </div>
              
              {data.regional_soil_analysis?.regional_comparison_notes && data.regional_soil_analysis.regional_comparison_notes.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-pebble space-y-1">
                  {data.regional_soil_analysis.regional_comparison_notes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-charcoal text-xs">
                      <span className="text-leaf">▪</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Soil Report Missing Notice */}
          {!data.soil_health_analysis?.has_soil_report && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-center justify-between gap-2 font-medium">
              <span>ℹ️ {t('msg_no_soil_report')}</span>
            </div>
          )}
        </div>

        {/* Step 6: Crop Suitability */}
        <div className="p-4 bg-mist/50 border border-pebble/70 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span>🌾</span> {t('loc_step_6_crop')}
            </h3>
            <span className="text-[11px] font-mono text-sage bg-white px-2 py-0.5 rounded border border-pebble">
              {srcCrop}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-sage">Recommended Crop:</span>
            <span className="px-3 py-1 bg-forest text-cream font-bold text-sm rounded-lg">
              {data.crop_suitability?.recommended_crop}
            </span>
          </div>
          <p className="text-charcoal/90 text-xs leading-relaxed">
            {data.crop_suitability?.suitability_explanation}
          </p>
        </div>

        {/* Step 7: Disease Risk Context */}
        <div className="p-4 bg-mist/50 border border-pebble/70 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span>🛡️</span> {t('loc_step_7_disease')}
            </h3>
            <span className="text-[11px] font-mono text-sage bg-white px-2 py-0.5 rounded border border-pebble">
              {srcDisease}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Image Model Diagnosis */}
            <div className="p-3 bg-white border border-pebble rounded-lg space-y-1">
              <span className="text-sage block font-mono uppercase text-[10px]">Crop Image Diagnosis</span>
              <p className="font-semibold text-charcoal">
                {data.disease_risk?.has_crop_image
                  ? data.disease_risk.model_diagnosis
                  : `📷 ${t('msg_no_crop_image')}`}
              </p>
            </div>

            {/* Environmental Disease Vulnerability */}
            <div className="p-3 bg-white border border-pebble rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sage font-mono uppercase text-[10px]">Environmental Disease Risk</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  data.disease_risk?.environmental_vulnerability === 'HIGH'
                    ? 'bg-risk/15 text-risk'
                    : 'bg-meadow/15 text-meadow'
                }`}>
                  {data.disease_risk?.environmental_vulnerability} VULNERABILITY
                </span>
              </div>
              <p className="text-charcoal/90 text-xs">
                {data.disease_risk?.environmental_risk_analysis}
              </p>
            </div>
          </div>
        </div>

        {/* Step 8: Overall Farm Risk */}
        <div className="p-4 bg-mist/50 border border-pebble/70 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span>⚖️</span> {t('loc_step_8_risk')}
            </h3>
            <span className="text-[11px] font-mono text-sage bg-white px-2 py-0.5 rounded border border-pebble">
              {srcFarmRisk}
            </span>
          </div>

          {isInsufficientRiskData ? (
            <div className="p-3.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 text-xs font-semibold">
              ⚠️ {t('msg_insufficient_farm_risk')}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white border border-pebble rounded-lg">
              <div>
                <span className="text-xs text-sage block font-mono uppercase">Assessed Farm Health Status</span>
                <span className="text-sm font-bold text-charcoal">
                  {data.farm_risk?.risk_factors?.join(' • ') || 'All farm health factors normal.'}
                </span>
              </div>
              <span className={`px-4 py-1.5 rounded-lg text-sm font-bold tracking-wider flex-shrink-0 ${
                farmRiskLevel === 'HIGH'
                  ? 'bg-risk text-cream'
                  : farmRiskLevel === 'LOW'
                  ? 'bg-meadow text-cream'
                  : 'bg-harvest text-cream'
              }`}>
                {farmRiskLevel} RISK
              </span>
            </div>
          )}
        </div>

        {/* Step 9: Prioritized Recommended Actions */}
        <div className="p-4 bg-mist/50 border border-pebble/70 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span>🎯</span> {t('loc_step_9_actions')}
            </h3>
            <span className="text-[11px] font-mono text-sage bg-white px-2 py-0.5 rounded border border-pebble">
              {srcActions}
            </span>
          </div>

          <div className="space-y-2.5">
            {actionsList.map((item, idx) => {
              const isImmediate = item.priority === 'IMMEDIATE ACTION'
              const isNext = item.priority === 'NEXT ACTION'
              const label = isImmediate ? t('act_immediate') : isNext ? t('act_next') : t('act_monitor')

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                    isImmediate
                      ? 'bg-risk/5 border-risk/40 text-charcoal'
                      : isNext
                      ? 'bg-forest/5 border-forest/30 text-charcoal'
                      : 'bg-white border-pebble text-charcoal'
                  }`}
                >
                  <span className={`px-2 py-1 rounded font-mono font-bold text-[10px] flex-shrink-0 uppercase ${
                    isImmediate ? 'bg-risk text-cream' : isNext ? 'bg-forest text-cream' : 'bg-sage/20 text-sage font-bold'
                  }`}>
                    {label}
                  </span>
                  <p className="font-medium text-sm leading-snug pt-0.5">
                    {item.action}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
