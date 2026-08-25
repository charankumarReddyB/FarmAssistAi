import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { AiBadge } from '../components/StatusBadge'

const FORECAST = [
  { day: 'Today', icon: '⛅', temp: '32°', rain: '12%', active: true },
  { day: 'Tue', icon: '🌧', temp: '28°', rain: '78%', active: false },
  { day: 'Wed', icon: '🌦', temp: '30°', rain: '45%', active: false },
  { day: 'Thu', icon: '☀', temp: '33°', rain: '5%', active: false },
  { day: 'Fri', icon: '☀', temp: '34°', rain: '3%', active: false },
]

const HEALTH_ITEMS = [
  {
    key: 'health_soil',
    status: 'needs_attention',
    statusKey: 'health_needs_attention',
    score: 72,
    detail: 'Nitrogen deficiency detected',
    navKey: 'soil' as const,
  },
  {
    key: 'health_crop',
    status: 'good',
    statusKey: 'health_good',
    score: 84,
    detail: 'No spreading disease detected',
    navKey: 'crop' as const,
  },
  {
    key: 'health_weather',
    status: 'moderate',
    statusKey: 'health_moderate',
    score: 65,
    detail: 'Rain tomorrow — low irrigation risk',
    navKey: 'dashboard' as const,
  },
  {
    key: 'health_water',
    status: 'good',
    statusKey: 'health_good',
    score: 88,
    detail: 'Soil moisture within range',
    navKey: 'soil' as const,
  },
  {
    key: 'health_risk',
    status: 'moderate',
    statusKey: 'health_moderate',
    score: 55,
    detail: 'Soil and crop issues need action',
    navKey: 'advisory' as const,
  },
]

const STATUS_TEXT: Record<string, string> = {
  needs_attention: 'text-risk',
  good: 'text-meadow',
  moderate: 'text-harvest',
}

type FarmerView = 'dashboard' | 'soil' | 'crop' | 'advisory' | 'voice' | 'farm' | 'reports' | 'alerts'

function ScoreRing({ score, status }: { score: number; status: string }) {
  const circumference = 2 * Math.PI * 20
  const strokeDash = (score / 100) * circumference
  const color =
    status === 'good' ? '#2d6a4f' : status === 'moderate' ? '#c97a18' : '#a33320'

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
      <circle cx="24" cy="24" r="20" fill="none" stroke="#ede8e0" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumference}`}
      />
    </svg>
  )
}

export function Dashboard() {
  const { t, setView } = useApp()
  const [weatherData, setWeatherData] = useState<{
    location: string
    temperature: number
    humidity: number
    wind_speed: number
    rain_probability: number
    condition: string
    farm_impact: string
  }>({
    location: 'Kakinada, Andhra Pradesh',
    temperature: 32,
    humidity: 74,
    wind_speed: 12,
    rain_probability: 12,
    condition: 'Partly Cloudy',
    farm_impact: 'Rain expected tomorrow morning. Irrigation may not be necessary today.'
  })

  const [userProfile, setUserProfile] = useState<{
    name: string
    location: string
    state: string
    district: string
  }>({
    name: 'Raju',
    location: 'Kakinada, Andhra Pradesh',
    state: 'Andhra Pradesh',
    district: 'Kakinada'
  })

  const [locAnalysis, setLocAnalysis] = useState<any>(null)

  useEffect(() => {
    // Read saved farmer profile from localStorage
    const savedUser = localStorage.getItem('farmassist_user')
    let st = 'Andhra Pradesh'
    let dist = 'Kakinada'
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        const nameStr = parsed.name || parsed.full_name || 'Raju'
        dist = parsed.district || 'Kakinada'
        st = parsed.state || 'Andhra Pradesh'
        setUserProfile({
          name: nameStr.split(' ')[0],
          location: `${dist}, ${st}`,
          state: st,
          district: dist
        })
      } catch (e) {}
    }

    // Fetch dynamic weather from API
    fetch(`http://127.0.0.1:8000/api/weather?location=${encodeURIComponent(`${dist}, ${st}`)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.temperature !== undefined) {
          setWeatherData({
            location: data.location || `${dist}, ${st}`,
            temperature: data.temperature,
            humidity: data.humidity || 74,
            wind_speed: data.wind_speed || 12,
            rain_probability: data.rain_probability || 12,
            condition: data.condition || 'Partly Cloudy',
            farm_impact: data.farm_impact || 'Weather is favorable for standard farming activities.'
          })
        }
      })
      .catch(() => {})

    // Fetch Location-Based Farm Analysis API
    fetch(`http://127.0.0.1:8000/api/farm/location-analysis?state=${encodeURIComponent(st)}&district=${encodeURIComponent(dist)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setLocAnalysis(data)
        }
      })
      .catch(() => {})
  }, [lang])

  const overallScore = Math.round(
    HEALTH_ITEMS.reduce((sum, h) => sum + h.score, 0) / HEALTH_ITEMS.length
  )

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Greeting header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sage text-sm font-mono mb-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="font-display text-3xl text-charcoal">
            {t('dash_greeting')}, {userProfile.name}
          </h1>
          <p className="text-sage text-sm mt-1 flex items-center gap-2">
            <span>📍</span>
            <span>{userProfile.location}</span>
            <span className="text-pebble">·</span>
            <span>🌾 {t('dash_current_crop')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <AiBadge label={t('dash_ai_label')} />
          <AiBadge verified label={t('dash_expert_verified')} />
        </div>
      </div>

      {/* Top summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('health_farm_health'), value: `${overallScore}/100`, sub: t('health_moderate'), color: 'text-harvest', nav: 'advisory' as FarmerView },
          { label: t('health_soil_score'), value: '72/100', sub: t('health_needs_attention'), color: 'text-risk', nav: 'soil' as FarmerView },
          { label: t('health_crop_health'), value: '84/100', sub: t('health_good'), color: 'text-meadow', nav: 'crop' as FarmerView },
          { label: t('health_active_alerts'), value: '3', sub: `1 ${t('alerts_high').toLowerCase()}`, color: 'text-harvest', nav: 'alerts' as FarmerView },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setView(s.nav)}
            className="bg-white border border-pebble rounded-xl p-4 text-left hover:border-leaf/40 transition-colors group cursor-pointer"
          >
            <div className="text-sage text-xs font-mono uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`font-display text-2xl ${s.color}`}>{s.value}</div>
            <div className="text-sage text-xs mt-0.5">{s.sub}</div>
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Weather module */}
          <div className="bg-forest text-cream rounded-2xl overflow-hidden shadow-sm border border-forest/30">
            {/* Top row */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
              <div>
                <div className="text-cream/60 text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{weatherData.location}</span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <span className="font-display text-6xl text-cream leading-none">{Math.round(weatherData.temperature)}°</span>
                    <span className="text-cream/60 text-lg ml-1">C</span>
                  </div>
                  <div className="pb-1.5">
                    <div className="text-cream font-medium text-lg leading-tight">{weatherData.condition}</div>
                    <div className="text-cream/50 text-sm">{t('weather_feels_like')} {Math.round(weatherData.temperature + 2)}° · {t('weather_live_forecast')}</div>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2 mt-1">
                <div className="flex items-center gap-2 text-sm text-cream/70 justify-end">
                  <span>💧</span>
                  <span className="text-cream/50">{t('weather_humidity')}</span>
                  <span className="text-cream font-mono font-semibold">{weatherData.humidity}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-cream/70 justify-end">
                  <span>💨</span>
                  <span className="text-cream/50">{t('weather_wind')}</span>
                  <span className="text-cream font-mono font-semibold">{weatherData.wind_speed} km/h</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-cream/70 justify-end">
                  <span>🌧</span>
                  <span className="text-cream/50">{t('weather_rain')}</span>
                  <span className="text-cream font-mono font-semibold">{weatherData.rain_probability}%</span>
                </div>
              </div>
            </div>

            {/* Forecast strip */}
            <div className="px-4 pb-4 flex gap-2">
              {FORECAST.map((f) => (
                <div
                  key={f.day}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-center transition-colors ${
                    f.active ? 'bg-white/15' : 'bg-white/6 hover:bg-white/10'
                  }`}
                >
                  <span className="text-cream/55 text-xs font-mono">{f.day}</span>
                  <span className="text-xl leading-none">{f.icon}</span>
                  <span className="text-cream font-mono font-semibold text-sm">{f.day === 'Today' ? `${Math.round(weatherData.temperature)}°` : f.temp}</span>
                  <span className={`text-xs font-mono ${f.day === 'Today' ? (weatherData.rain_probability > 50 ? 'text-sky-300' : 'text-cream/40') : (parseFloat(f.rain) > 50 ? 'text-sky-300' : 'text-cream/40')}`}>
                    {f.day === 'Today' ? `${weatherData.rain_probability}%` : f.rain}
                  </span>
                </div>
              ))}
            </div>

            {/* Farm impact */}
            <div className="bg-black/20 px-6 py-3 flex items-start gap-3">
              <span className="text-harvest text-sm flex-shrink-0 mt-0.5">◉</span>
              <div>
                <span className="text-cream/50 text-xs font-mono uppercase tracking-widest mr-2">
                  {t('weather_impact')}:
                </span>
                <span className="text-cream/90 text-sm">{weatherData.farm_impact}</span>
              </div>
            </div>
          </div>

          {/* Today's advice */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-charcoal">{t('dash_today_advice')}</h2>
              <button
                onClick={() => setView('advisory')}
                className="text-xs text-leaf hover:text-forest transition-colors font-medium cursor-pointer"
              >
                {t('dash_full_advisory')} →
              </button>
            </div>
            <div className="space-y-3">
              {[
                {
                  num: '01',
                  section: t('advice_irrigation'),
                  reason: t('advice_rain_reason'),
                  action: t('advice_delay_irrigation'),
                  numBg: 'bg-rain/10 text-rain',
                  border: 'hover:border-rain/40',
                  nav: 'advisory' as FarmerView,
                },
                {
                  num: '02',
                  section: t('advice_soil'),
                  reason: t('advice_nitrogen_reason'),
                  action: t('advice_nitrogen'),
                  numBg: 'bg-harvest/10 text-harvest',
                  border: 'hover:border-harvest/40',
                  nav: 'soil' as FarmerView,
                },
                {
                  num: '03',
                  section: t('advice_crop'),
                  reason: t('advice_disease_reason'),
                  action: t('advice_disease'),
                  numBg: 'bg-risk/8 text-risk',
                  border: 'hover:border-risk/30',
                  nav: 'crop' as FarmerView,
                },
              ].map((card) => (
                <div
                  key={card.num}
                  className={`bg-white border border-pebble rounded-xl p-4 flex items-start gap-4 transition-colors cursor-pointer group ${card.border}`}
                  onClick={() => setView(card.nav)}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-sm font-bold ${card.numBg}`}
                  >
                    {card.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-charcoal">{card.section}</span>
                      <span className="text-sage text-xs">{card.reason}</span>
                    </div>
                    <p className="text-charcoal text-sm font-medium">{card.action}</p>
                  </div>
                  <span className="text-sage text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1 font-mono">
                    {t('advice_view_details')} →
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Location-Based Farm Intelligence Section */}
          {locAnalysis && (
            <div className="bg-white border border-pebble rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-pebble/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-charcoal">
                      {t('loc_analysis_title')}
                    </h2>
                    <p className="text-xs text-sage font-mono">
                      Location Context: {locAnalysis.location?.full_location}
                    </p>
                  </div>
                </div>
                <AiBadge label="Location Sync" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. Regional Climate Context */}
                <div className="p-3.5 bg-mist/60 border border-pebble/60 rounded-xl space-y-1.5">
                  <div className="font-bold text-charcoal text-sm flex items-center gap-1.5">
                    <span>🌦️</span> {t('loc_climate_context')}
                  </div>
                  <div className="text-sage font-medium">
                    Zone: <span className="text-charcoal font-semibold">{locAnalysis.climate_context?.zone_name || 'Agro-Climatic Zone'}</span>
                  </div>
                  <div className="text-sage">
                    Season: <span className="text-leaf font-semibold">{locAnalysis.climate_context?.current_season}</span>
                  </div>
                  <p className="text-charcoal/90 leading-snug mt-1">
                    {locAnalysis.climate_context?.seasonal_agricultural_context}
                  </p>
                  {locAnalysis.climate_context?.climate_risks?.length > 0 && (
                    <div className="mt-1 text-risk font-medium text-[11px]">
                      ⚠️ Risks: {locAnalysis.climate_context.climate_risks.join(', ')}
                    </div>
                  )}
                </div>

                {/* 2. Regional Soil Baseline Comparison */}
                <div className="p-3.5 bg-mist/60 border border-pebble/60 rounded-xl space-y-1.5">
                  <div className="font-bold text-charcoal text-sm flex items-center gap-1.5">
                    <span>🌱</span> {t('loc_regional_soil')}
                  </div>
                  <div className="text-sage font-medium">
                    Regional Soil Type: <span className="text-charcoal font-semibold">{locAnalysis.regional_soil_analysis?.regional_soil_type}</span>
                  </div>
                  <div className="text-charcoal/90 leading-snug space-y-1 mt-1">
                    {locAnalysis.regional_soil_analysis?.regional_comparison_notes?.map((note: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-leaf">▪</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Location Crop Suitability */}
                <div className="p-3.5 bg-mist/60 border border-pebble/60 rounded-xl space-y-1.5">
                  <div className="font-bold text-charcoal text-sm flex items-center gap-1.5">
                    <span>🌾</span> {t('loc_crop_suitability')}
                  </div>
                  <div className="text-forest font-bold text-sm">
                    Recommended: {locAnalysis.crop_suitability?.recommended_crop}
                  </div>
                  <p className="text-charcoal/90 leading-snug">
                    {locAnalysis.crop_suitability?.suitability_explanation}
                  </p>
                </div>

                {/* 4. Disease Risk & Next Action */}
                <div className="p-3.5 bg-mist/60 border border-pebble/60 rounded-xl space-y-1.5">
                  <div className="font-bold text-charcoal text-sm flex items-center gap-1.5">
                    <span>🛡️</span> {t('loc_disease_risk')} & Risk Level
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sage">Overall Farm Risk:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      locAnalysis.farm_risk?.level === 'HIGH' ? 'bg-risk/15 text-risk' : 'bg-meadow/15 text-meadow'
                    }`}>
                      {locAnalysis.farm_risk?.level} RISK
                    </span>
                  </div>
                  <div className="text-charcoal/90 text-xs mt-1">
                    <span className="font-semibold text-charcoal">Recommended Next Action:</span>
                    <p className="text-forest font-medium mt-0.5 leading-snug">
                      {locAnalysis.recommended_action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div>
            <h2 className="font-display text-xl text-charcoal mb-3">{t('dash_quick_actions')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: '◎',
                  labelKey: 'qa_soil',
                  subKey: 'qa_soil_sub',
                  view: 'soil' as FarmerView,
                  accent: 'group-hover:text-rain',
                  border: 'hover:border-rain/30 hover:bg-rain/4',
                },
                {
                  icon: '⬢',
                  labelKey: 'qa_crop',
                  subKey: 'qa_crop_sub',
                  view: 'crop' as FarmerView,
                  accent: 'group-hover:text-leaf',
                  border: 'hover:border-leaf/30 hover:bg-leaf/4',
                },
                {
                  icon: '◯',
                  labelKey: 'qa_ask',
                  subKey: 'qa_ask_sub',
                  view: 'voice' as FarmerView,
                  accent: 'group-hover:text-harvest',
                  border: 'hover:border-harvest/30 hover:bg-harvest/4',
                },
                {
                  icon: '◐',
                  labelKey: 'qa_advisory',
                  subKey: 'qa_advisory_sub',
                  view: 'advisory' as FarmerView,
                  accent: 'group-hover:text-forest',
                  border: 'hover:border-forest/20 hover:bg-forest/4',
                },
              ].map((action) => (
                <button
                  key={action.labelKey}
                  onClick={() => setView(action.view)}
                  className={`group bg-white border border-pebble rounded-xl p-4 flex flex-col items-start text-left transition-all ${action.border}`}
                >
                  <span className={`text-2xl text-sage mb-2.5 transition-colors ${action.accent}`}>
                    {action.icon}
                  </span>
                  <span className="text-charcoal font-semibold text-sm leading-tight">
                    {t(action.labelKey)}
                  </span>
                  <span className="text-sage text-xs mt-1 leading-snug">
                    {t(action.subKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Farm health snapshot */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl text-charcoal">{t('dash_farm_health')}</h2>
              <button
                onClick={() => setView('advisory')}
                className="text-xs text-sage hover:text-charcoal font-mono transition-colors"
              >
                Risk Analysis →
              </button>
            </div>
            <div className="bg-white border border-pebble rounded-2xl overflow-hidden">
              {HEALTH_ITEMS.map((item, idx) => (
                <button
                  key={item.key}
                  onClick={() => setView(item.navKey as FarmerView)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-mist/60 transition-colors ${
                    idx < HEALTH_ITEMS.length - 1 ? 'border-b border-pebble/60' : ''
                  }`}
                >
                  {/* Score ring */}
                  <div className="relative flex-shrink-0">
                    <ScoreRing score={item.score} status={item.status} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-mono font-bold ${STATUS_TEXT[item.status]}`}>
                        {item.score}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-charcoal text-sm font-medium">{t(item.key)}</div>
                    <div className="text-sage text-xs truncate">{item.detail}</div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs font-mono ${STATUS_TEXT[item.status]}`}>
                      {t(item.statusKey)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
